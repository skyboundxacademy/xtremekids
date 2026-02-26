
"use client"

import { BottomNav } from "@/components/BottomNav";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Heart, User, Sparkles, Loader2, Plus, Globe, Send, ArrowLeft, Search, Repeat2, MessageSquare, CheckCircle2, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, query, orderBy, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, where, limit, increment, onSnapshot } from "firebase/firestore";
import Image from "next/image";
import { explainConcept } from "@/ai/flows/concept-explainer";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

function HighlightText({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(/(\s+)/);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('#')) {
          return <span key={i} className="text-secondary font-black">{part}</span>;
        }
        if (part.startsWith('@')) {
          return <span key={i} className="text-primary font-black">{part}</span>;
        }
        return part;
      })}
    </>
  );
}

function PostComments({ postId }: { postId: string }) {
  const db = useFirestore();
  const { user } = useUser();
  const [comments, setComments] = useState<any[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    const q = query(collection(db, `posts/${postId}/comments`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      setComments(data.sort((a, b) => {
        if ((b.likesCount || 0) !== (a.likesCount || 0)) {
          return (b.likesCount || 0) - (a.likesCount || 0);
        }
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      }));
    });
    return () => unsubscribe();
  }, [db, postId]);

  const handleLikeComment = (commentId: string, currentLikes: string[] = []) => {
    if (!user) return;
    const commentRef = doc(db, `posts/${postId}/comments`, commentId);
    const hasLiked = currentLikes.includes(user.uid);
    updateDoc(commentRef, {
      likes: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      likesCount: increment(hasLiked ? -1 : 1)
    });
  };

  const submitComment = () => {
    if (!user || !commentText) return;
    const commentData = {
      userId: user.uid,
      userName: user.displayName || "Explorer",
      userPhoto: user.photoURL,
      text: commentText,
      likes: [],
      likesCount: 0,
      timestamp: serverTimestamp()
    };
    addDoc(collection(db, `posts/${postId}/comments`), commentData).then(() => {
      updateDoc(doc(db, "posts", postId), { commentCount: increment(1) });
      setCommentText("");
    });
  };

  const topComments = showAll ? comments : comments.slice(0, 3);

  return (
    <div className="mt-4 space-y-3">
      <div className="flex gap-2 mb-4">
        <Input 
          className="rounded-xl h-10 text-xs bg-slate-50 border-none italic" 
          placeholder="Add a comment..." 
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submitComment()}
        />
        <Button size="sm" className="rounded-xl bg-primary h-10 px-4 font-bold" onClick={submitComment}>Post</Button>
      </div>

      {topComments.map((c) => (
        <div key={c.id} className="flex gap-3 animate-in fade-in slide-in-from-top-1">
          <div className="w-8 h-8 rounded-lg bg-slate-100 relative shrink-0 overflow-hidden border border-slate-100">
             <Image src={c.userPhoto || `https://picsum.photos/seed/${c.userId}/50/50`} alt="p" fill className="object-cover" unoptimized />
          </div>
          <div className="flex-1 bg-slate-50 p-3 rounded-2xl relative border border-slate-100/50">
            <h5 className="text-[10px] font-black text-slate-900 mb-1">{c.userName}</h5>
            <p className="text-xs font-medium text-slate-700 leading-tight"><HighlightText text={c.text} /></p>
            <button 
              onClick={() => handleLikeComment(c.id, c.likes)}
              className={cn("absolute bottom-2 right-3 flex items-center gap-1 text-[10px] font-bold", c.likes?.includes(user?.uid) ? "text-rose-500" : "text-slate-400")}
            >
              <Heart className={cn("w-3 h-3", c.likes?.includes(user?.uid) && "fill-rose-500")} /> {c.likesCount || 0}
            </button>
          </div>
        </div>
      ))}

      {comments.length > 3 && (
        <button 
          onClick={() => setShowAll(!showAll)}
          className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1 mt-2 pl-2"
        >
          {showAll ? <><ChevronUp className="w-3 h-3"/> Show Less</> : <><ChevronDown className="w-3 h-3"/> See More Comments ({comments.length - 3})</>}
        </button>
      )}
    </div>
  );
}

function PostCard({ post, allUsers }: { post: any, allUsers: any[] }) {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const postUser = allUsers?.find(u => u.id === post.userId);
  
  const getUserTitle = (stars: number = 0) => {
    if (stars > 3000) return "Skybound Legend";
    if (stars > 1500) return "Star Master";
    if (stars > 500) return "Explorer";
    if (stars > 100) return "Cadet";
    return "Rookie";
  };

  const toggleLike = () => {
    if (!user) return;
    const postRef = doc(db, "posts", post.id);
    const hasLiked = (Array.isArray(post.likes) ? post.likes : []).includes(user.uid);
    updateDoc(postRef, {
      likes: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      likesCount: increment(hasLiked ? -1 : 1)
    });
  };

  const handleRepost = () => {
    if (!user) return;
    updateDoc(doc(db, "posts", post.id), { reposts: increment(1) });
    const repostData = {
      userId: user.uid,
      userName: user.displayName || "Explorer",
      userPhoto: user.photoURL,
      content: post.content,
      isRepost: true,
      originalAuthor: post.userName,
      originalContent: post.content,
      originalPostId: post.id,
      likes: [],
      likesCount: 0,
      reposts: 0,
      commentCount: 0,
      timestamp: serverTimestamp()
    };
    addDoc(collection(db, "posts"), repostData);
  };

  const isLongPost = post.content?.length > 200;
  const hasLiked = (Array.isArray(post.likes) ? post.likes : []).includes(user?.uid);

  return (
    <Card className={cn("border-none kid-card-shadow bg-white rounded-[2.5rem] overflow-hidden p-6 mb-8", post.isGuruResponse && "ring-4 ring-purple-100 border-2 border-purple-200")}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/profile?uid=${post.userId}`)}>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden relative shadow-inner border border-slate-100">
            <Image src={post.userPhoto || `https://picsum.photos/seed/${post.userId}/100/100`} alt={post.userName} fill className="object-cover" unoptimized />
          </div>
          <div>
            <h4 className="font-black text-slate-800 text-sm flex items-center gap-1 leading-none mb-1">
              {post.userName}
              {post.isGuruResponse && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 fill-purple-100" />}
            </h4>
            <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest bg-primary/10 text-primary">
              {getUserTitle(postUser?.totalStars || 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {post.isRepost && (
           <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">
              <Repeat2 className="w-3.5 h-3.5 text-green-500" /> Reposted by {post.userName}
           </div>
        )}
        
        {post.repostCaption && (
          <p className="text-[15px] font-bold text-primary leading-relaxed whitespace-pre-wrap mb-4">
            <HighlightText text={post.repostCaption} />
          </p>
        )}

        <div className={cn(post.isRepost && "p-5 rounded-3xl bg-slate-50 border border-slate-100 border-dashed")}>
          {post.isRepost && <h6 className="text-[10px] font-black text-slate-400 uppercase mb-3 flex items-center gap-1.5"><User className="w-3 h-3"/> {post.originalAuthor}'s Insight</h6>}
          <div className={cn("text-[15px] font-medium text-slate-700 leading-relaxed whitespace-pre-wrap", !expanded && isLongPost && "line-clamp-4")}>
            <HighlightText text={post.content} />
          </div>
          {isLongPost && (
            <button onClick={() => setExpanded(!expanded)} className="text-primary font-black text-[10px] uppercase tracking-widest mt-2 hover:underline">
              {expanded ? "See Less" : "Read More..."}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-8 mt-6 pt-4 border-t border-slate-50">
        <button onClick={toggleLike} className={cn("flex items-center gap-2 font-black text-xs transition-all active:scale-125", hasLiked ? 'text-rose-500' : 'text-slate-400')}>
          <Heart className={cn("w-5 h-5", hasLiked && 'fill-rose-500')} /> {post.likesCount || 0}
        </button>
        <button className="flex items-center gap-2 text-slate-400 font-black text-xs">
          <MessageSquare className="w-5 h-5" /> {post.commentCount || 0}
        </button>
        <button onClick={handleRepost} className="flex items-center gap-2 text-slate-400 font-black text-xs hover:text-green-500">
          <Repeat2 className="w-5 h-5" /> {post.reposts || 0}
        </button>
      </div>

      <PostComments postId={post.id} />
    </Card>
  );
}

export default function LabPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [activeTab, setActiveTab] = useState("social");
  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const postsQuery = useMemoFirebase(() => {
    return query(collection(db, "posts"), orderBy("timestamp", "desc"), limit(50));
  }, [db]);
  const { data: posts, isLoading: isPostsLoading } = useCollection<any>(postsQuery);

  const usersQuery = useMemoFirebase(() => {
    return query(collection(db, "users"), limit(100));
  }, [db]);
  const { data: allUsers } = useCollection<any>(usersQuery);

  const [activeMessages, setActiveMessages] = useState<any[]>([]);
  useEffect(() => {
    if (!user || !selectedUser) return;
    const q = query(
      collection(db, "messages"),
      where("participants", "array-contains", user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs
        .map(d => ({ ...d.data(), id: d.id }))
        .filter((m: any) => m.participants.includes(selectedUser.id))
        .sort((a: any, b: any) => {
           const timeA = a.timestamp?.seconds || 0;
           const timeB = b.timestamp?.seconds || 0;
           return timeA - timeB;
        });
      setActiveMessages(msgs);
    });
    return () => unsubscribe();
  }, [db, user, selectedUser]);

  const handlePost = async () => {
    if (!user || !postContent) return;
    setIsPosting(true);
    
    const postData = {
      userId: user.uid,
      userName: user.displayName || "Explorer",
      userPhoto: user.photoURL,
      content: postContent,
      likes: [],
      likesCount: 0,
      reposts: 0,
      commentCount: 0,
      timestamp: serverTimestamp()
    };

    addDoc(collection(db, "posts"), postData)
      .then(async (docRef) => {
        if (postContent.toLowerCase().includes("@guru")) {
          const question = postContent.replace(/@guru/gi, "").trim();
          try {
            const res = await explainConcept({ concept: question });
            addDoc(collection(db, "posts"), {
              userId: "guru-ai",
              userName: "Professor Sky",
              userPhoto: "https://picsum.photos/seed/guru/200/200",
              content: postContent,
              isRepost: true,
              repostCaption: res.explanation,
              originalAuthor: user.displayName || 'Explorer',
              originalContent: postContent,
              originalPostId: docRef.id,
              likes: [],
              likesCount: 0,
              reposts: 0,
              isGuruResponse: true,
              timestamp: serverTimestamp()
            });
          } catch (e) {}
        }
      })
      .finally(() => {
        setPostContent("");
        setIsPosting(false);
      });
  };

  const filteredUsers = allUsers?.filter(u => 
    u.id !== user?.uid && 
    (u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  return (
    <main className="min-h-screen pb-32 px-4 pt-12 max-w-md mx-auto bg-slate-50/50">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-black text-primary flex items-center gap-2 uppercase tracking-tighter italic">
          The Lab <Globe className="text-secondary animate-float" />
        </h1>
      </header>

      <Tabs defaultValue="social" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-white p-1 rounded-3xl kid-card-shadow h-16">
          <TabsTrigger value="social" className="rounded-2xl font-black uppercase tracking-tighter">Feed</TabsTrigger>
          <TabsTrigger value="messages" className="rounded-2xl font-black uppercase tracking-tighter">Inbox</TabsTrigger>
        </TabsList>

        <TabsContent value="social">
          <Card className="border-none kid-card-shadow bg-white rounded-[2.5rem] mb-10 p-6">
            <div className="flex gap-4">
               <div className="w-12 h-12 rounded-2xl bg-primary/10 relative overflow-hidden shrink-0 border border-primary/10">
                  <Image src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/100/100`} alt="Me" fill className="object-cover" unoptimized />
               </div>
               <textarea 
                  placeholder="Ask @guru or share #STEM ideas..." 
                  className="w-full p-2 text-base font-medium focus:outline-none bg-transparent resize-none min-h-[100px] italic" 
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                />
            </div>
            <Button onClick={handlePost} disabled={isPosting || !postContent} className="rounded-2xl bg-primary font-bold h-14 w-full text-lg mt-4 shadow-lg shadow-primary/20">
              {isPosting ? <Loader2 className="animate-spin" /> : <><Plus className="w-5 h-5 mr-2" /> Share Insight</>}
            </Button>
          </Card>

          <div className="space-y-4">
            {isPostsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="border-none kid-card-shadow bg-white rounded-[2.5rem] p-6 mb-8 h-64">
                  <div className="flex items-center gap-3 mb-5">
                    <Skeleton className="w-12 h-12 rounded-2xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-24 w-full rounded-2xl" />
                </Card>
              ))
            ) : posts?.map((post) => (
              <PostCard key={post.id} post={post} allUsers={allUsers || []} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="messages">
          {!selectedUser ? (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input 
                  className="pl-12 rounded-[2rem] border-none bg-white kid-card-shadow h-16 text-base font-medium italic" 
                  placeholder="Find an Explorer to chat..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="grid gap-4">
                {filteredUsers.map(u => (
                  <Card key={u.id} className="border-none kid-card-shadow bg-white rounded-[2rem] p-6 flex items-center gap-4 cursor-pointer active:scale-95 transition-all hover:bg-slate-50" onClick={() => setSelectedUser(u)}>
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 relative overflow-hidden border-2 border-primary/5">
                      <Image src={u.photoURL || `https://picsum.photos/seed/${u.id}/100/100`} alt={u.displayName} fill className="object-cover" unoptimized />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-lg leading-tight mb-1">{u.displayName || "Explorer"}</h4>
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest opacity-60 italic">Level: {u.totalStars || 0} Stars</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[3rem] kid-card-shadow flex flex-col h-[70vh] animate-in slide-in-from-right-10 overflow-hidden border-4 border-white">
              <header className="p-6 border-b flex items-center justify-between bg-primary text-white shadow-md">
                <div className="flex items-center gap-4">
                   <button onClick={() => setSelectedUser(null)} className="hover:scale-110 transition-transform"><ArrowLeft className="w-6 h-6" /></button>
                   <div className="w-12 h-12 rounded-2xl bg-white/20 relative overflow-hidden border border-white/30">
                      <Image src={selectedUser.photoURL || `https://picsum.photos/seed/${selectedUser.id}/100/100`} alt="p" fill className="object-cover" unoptimized />
                   </div>
                   <div>
                     <h4 className="font-black text-sm leading-tight">{selectedUser.displayName}</h4>
                     <span className="text-[9px] font-bold opacity-60">Online Academy Chat</span>
                   </div>
                </div>
                <ShieldCheck className="w-6 h-6 opacity-40" />
              </header>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                {activeMessages.map(m => (
                  <div key={m.id} className={cn("flex", m.senderId === user?.uid ? 'justify-end' : 'justify-start')}>
                    <div className={cn("max-w-[85%] p-4 rounded-[1.8rem] text-sm font-bold leading-relaxed shadow-sm", m.senderId === user?.uid ? 'bg-primary text-white rounded-br-none' : 'bg-white text-slate-700 rounded-bl-none border border-slate-100')}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-5 bg-white border-t flex gap-3">
                <Input 
                  className="rounded-2xl bg-slate-50 border-none h-14 font-bold px-6 italic" 
                  placeholder="Type a message..." 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button size="icon" className="rounded-2xl shrink-0 h-14 w-14 bg-primary shadow-lg shadow-primary/20" onClick={sendMessage}>
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
      <BottomNav />
    </main>
  );

  function sendMessage() {
    if (!user || !selectedUser || !messageText) return;
    addDoc(collection(db, "messages"), {
      participants: [user.uid, selectedUser.id],
      senderId: user.uid,
      receiverId: selectedUser.id,
      text: messageText,
      timestamp: serverTimestamp()
    });
    setMessageText("");
  }
}
