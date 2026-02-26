
"use client"

import { BottomNav } from "@/components/BottomNav";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, User, Sparkles, Loader2, Plus, Globe, Send, ArrowLeft, Search, Repeat2, Bookmark, CheckCircle2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, query, orderBy, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, where, limit } from "firebase/firestore";
import Image from "next/image";
import { explainConcept } from "@/ai/flows/concept-explainer";

export default function LabPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [activeTab, setActiveTab] = useState("social");
  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Social Posts Stream
  const postsQuery = useMemoFirebase(() => {
    return query(collection(db, "posts"), orderBy("timestamp", "desc"), limit(50));
  }, [db]);
  const { data: posts, isLoading: isPostsLoading } = useCollection<any>(postsQuery);

  // Users for Messaging and Titles
  const usersQuery = useMemoFirebase(() => {
    return query(collection(db, "users"), limit(100));
  }, [db]);
  const { data: allUsers } = useCollection<any>(usersQuery);

  const chatQuery = useMemoFirebase(() => {
    if (!user || !selectedUser) return null;
    return query(
      collection(db, "messages"),
      where("participants", "array-contains", user.uid),
      orderBy("timestamp", "asc")
    );
  }, [db, user, selectedUser]);
  const { data: rawMessages } = useCollection<any>(chatQuery);

  const activeMessages = rawMessages?.filter(m => 
    m.participants.includes(user?.uid) && m.participants.includes(selectedUser?.id)
  ) || [];

  const getUserTitle = (stars: number = 0) => {
    if (stars > 3000) return "Skybound Legend";
    if (stars > 1500) return "Star Master";
    if (stars > 500) return "Explorer";
    if (stars > 100) return "Cadet";
    return "Rookie";
  };

  const getUserRankColor = (title: string) => {
    switch(title) {
      case "Skybound Legend": return "text-yellow-500 bg-yellow-50";
      case "Star Master": return "text-purple-600 bg-purple-50";
      case "Explorer": return "text-blue-600 bg-blue-50";
      case "Cadet": return "text-green-600 bg-green-50";
      default: return "text-slate-400 bg-slate-50";
    }
  };

  const handlePost = async () => {
    if (!user || !postContent) return;
    setIsPosting(true);
    
    const postData = {
      userId: user.uid,
      userName: user.displayName || "Explorer",
      userPhoto: user.photoURL,
      content: postContent,
      likes: [],
      reposts: 0,
      commentCount: 0,
      timestamp: serverTimestamp()
    };

    await addDoc(collection(db, "posts"), postData);

    if (postContent.toLowerCase().includes("@guru")) {
      try {
        const question = postContent.replace(/@guru/gi, "").trim();
        const res = await explainConcept({ concept: question });
        await addDoc(collection(db, "posts"), {
          userId: "guru-ai",
          userName: "Professor Sky",
          userPhoto: "https://picsum.photos/seed/guru/200/200",
          content: `@${user.displayName || 'Explorer'}, ${res.explanation}`,
          likes: [],
          isGuruResponse: true,
          timestamp: serverTimestamp()
        });
      } catch (e) {
        console.error("Guru was sleeping");
      }
    }

    setPostContent("");
    setIsPosting(false);
  };

  const toggleLike = async (post: any) => {
    if (!user) return;
    const postRef = doc(db, "posts", post.id);
    const isLiked = post.likes?.includes(user.uid);
    await updateDoc(postRef, {
      likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
    });
  };

  const sendMessage = async () => {
    if (!user || !selectedUser || !messageText) return;
    await addDoc(collection(db, "messages"), {
      participants: [user.uid, selectedUser.id],
      senderId: user.uid,
      receiverId: selectedUser.id,
      text: messageText,
      timestamp: serverTimestamp()
    });
    setMessageText("");
  };

  const filteredUsers = allUsers?.filter(u => 
    u.id !== user?.uid && 
    (u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  return (
    <main className="min-h-screen pb-24 px-4 pt-12 max-w-md mx-auto bg-slate-50">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-black text-primary flex items-center gap-2">
          Lab <Globe className="text-secondary animate-pulse" />
        </h1>
      </header>

      <Tabs defaultValue="social" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-white p-1 rounded-3xl kid-card-shadow h-16">
          <TabsTrigger value="social" className="rounded-2xl font-black flex gap-2 h-full uppercase tracking-tighter">
            <Sparkles className="w-5 h-5 text-yellow-400" /> For You
          </TabsTrigger>
          <TabsTrigger value="messages" className="rounded-2xl font-black flex gap-2 h-full uppercase tracking-tighter">
            <Send className="w-5 h-5 text-blue-400" /> Inbox
          </TabsTrigger>
        </TabsList>

        <TabsContent value="social">
          <Card className="border-none kid-card-shadow bg-white rounded-[2.5rem] mb-8 overflow-hidden">
            <CardContent className="p-6 flex flex-col gap-4">
              <div className="flex gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-primary/10 relative overflow-hidden shrink-0">
                    <Image src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/100/100`} alt="Me" fill className="object-cover" unoptimized />
                 </div>
                 <textarea 
                    placeholder="Ask @guru or share your STEM ideas!" 
                    className="w-full p-2 text-base font-medium focus:outline-none bg-transparent resize-none min-h-[80px]" 
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                  />
              </div>
              <Button 
                onClick={handlePost} 
                disabled={isPosting || !postContent} 
                className="rounded-2xl bg-primary font-bold h-14 w-full text-lg shadow-lg shadow-primary/20"
              >
                {isPosting ? <Loader2 className="animate-spin" /> : <><Plus className="w-5 h-5 mr-2" /> Publish Post</>}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-8">
            {isPostsLoading && (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
            )}
            {posts?.map((post) => {
              const postUser = allUsers?.find(u => u.id === post.userId);
              const title = getUserTitle(postUser?.totalStars || 0);
              const hasLiked = post.likes?.includes(user?.uid);
              
              return (
                <Card key={post.id} className={`border-none kid-card-shadow bg-white rounded-[2rem] overflow-hidden transition-all active:scale-[0.98] ${post.isGuruResponse ? 'ring-2 ring-purple-400/30' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden relative border-2 border-white shadow-sm">
                          {post.userPhoto ? (
                            <Image src={post.userPhoto} alt={post.userName} fill className="object-cover" unoptimized />
                          ) : (
                            <User className="text-primary w-full h-full p-3" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800 text-sm flex items-center gap-1 leading-none mb-1">
                            {post.userName}
                            {post.isGuruResponse && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 fill-purple-100" />}
                          </h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${getUserRankColor(title)}`}>
                            {title}
                          </span>
                        </div>
                      </div>
                      <button className="text-slate-300 hover:text-slate-500"><Plus className="w-5 h-5" /></button>
                    </div>

                    <p className="text-[15px] font-medium text-slate-700 leading-relaxed mb-6 whitespace-pre-wrap">
                      {post.content}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex gap-6">
                        <button 
                          onClick={() => toggleLike(post)}
                          className={`flex items-center gap-2 font-black text-sm transition-all ${hasLiked ? 'text-rose-500 scale-110' : 'text-slate-400'}`}
                        >
                          <Heart className={`w-5 h-5 ${hasLiked ? 'fill-rose-500' : ''}`} /> {post.likes?.length || 0}
                        </button>
                        <button className="flex items-center gap-2 text-slate-400 font-black text-sm hover:text-blue-500 transition-colors">
                          <MessageCircle className="w-5 h-5" /> {post.commentCount || 0}
                        </button>
                        <button className="flex items-center gap-2 text-slate-400 font-black text-sm hover:text-green-500 transition-colors">
                          <Repeat2 className="w-5 h-5" /> {post.reposts || 0}
                        </button>
                      </div>
                      <button className="text-slate-400 hover:text-primary transition-colors">
                        <Bookmark className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Simple Top Comments Placeholder */}
                    {post.commentCount > 0 && (
                       <div className="mt-4 pt-4 border-t border-slate-50 space-y-3">
                          <div className="flex gap-2 items-start">
                             <div className="w-6 h-6 rounded-lg bg-slate-100 shrink-0" />
                             <p className="text-xs text-slate-600 font-medium">Amazing insight! I learned this in Class 4 too.</p>
                          </div>
                          <button className="text-[10px] font-black text-primary uppercase tracking-wider pl-8">See 2 more comments</button>
                       </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="messages">
          {!selectedUser ? (
            <div className="space-y-6">
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input 
                  className="pl-12 rounded-[1.5rem] border-none bg-white kid-card-shadow h-14 text-base font-medium" 
                  placeholder="Find your squad members..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="grid gap-4">
                {filteredUsers.map(u => (
                  <Card 
                    key={u.id} 
                    className="border-none kid-card-shadow bg-white rounded-[1.8rem] p-5 flex items-center gap-4 cursor-pointer active:scale-95 transition-all group"
                    onClick={() => setSelectedUser(u)}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 relative overflow-hidden group-hover:scale-105 transition-transform">
                      {u.photoURL ? (
                        <Image src={u.photoURL} alt={u.displayName} fill className="object-cover" unoptimized />
                      ) : (
                        <User className="w-full h-full p-3 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-black text-slate-800 text-lg">{u.displayName || "Explorer"}</h4>
                        <span className="text-[10px] font-bold text-slate-300">12:30 PM</span>
                      </div>
                      <p className="text-xs font-bold text-primary uppercase tracking-tighter">
                         Level {Math.floor((u.totalStars || 0) / 100)} {getUserTitle(u.totalStars)}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] kid-card-shadow flex flex-col h-[70vh] animate-in slide-in-from-right-4 overflow-hidden border-4 border-white">
              <header className="p-6 border-b flex items-center justify-between bg-primary text-white">
                <div className="flex items-center gap-4">
                   <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                      <ArrowLeft className="w-6 h-6" />
                   </button>
                   <div className="w-10 h-10 rounded-xl bg-white/20 relative overflow-hidden shadow-inner">
                      {selectedUser.photoURL ? <Image src={selectedUser.photoURL} alt="p" fill unoptimized /> : <User className="p-1" />}
                   </div>
                   <div>
                      <h4 className="font-black text-sm">{selectedUser.displayName}</h4>
                      <div className="flex items-center gap-1">
                         <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                         <span className="text-[10px] font-bold text-white/70 uppercase">Online</span>
                      </div>
                   </div>
                </div>
                <ShieldCheck className="w-5 h-5 opacity-40" />
              </header>
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                {activeMessages.map(m => (
                  <div key={m.id} className={`flex ${m.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-[1.5rem] text-[13px] font-semibold leading-relaxed ${
                      m.senderId === user?.uid 
                        ? 'bg-primary text-white rounded-br-none shadow-lg shadow-primary/20' 
                        : 'bg-white text-slate-700 rounded-bl-none shadow-sm border border-slate-100'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-white border-t flex gap-3">
                <Input 
                  className="rounded-2xl bg-slate-100 border-none h-14 font-medium px-6 focus-visible:ring-primary/20" 
                  placeholder="Type a secret message..." 
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
}
