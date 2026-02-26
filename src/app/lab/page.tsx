
"use client"

import { BottomNav } from "@/components/BottomNav";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, User, Sparkles, Loader2, Plus, Globe, Send, ArrowLeft, Search } from "lucide-react";
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

  // Users for Messaging
  const usersQuery = useMemoFirebase(() => {
    return query(collection(db, "users"), limit(100));
  }, [db]);
  const { data: allUsers } = useCollection<any>(usersQuery);

  // Filtered messages
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

  const handlePost = async () => {
    if (!user || !postContent) return;
    setIsPosting(true);
    
    const postData = {
      userId: user.uid,
      userName: user.displayName || "Explorer",
      userPhoto: user.photoURL,
      content: postContent,
      likes: [],
      commentCount: 0,
      timestamp: serverTimestamp()
    };

    await addDoc(collection(db, "posts"), postData);

    // AI Guru Immediate Response if @guru is mentioned
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
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-white p-1 rounded-2xl kid-card-shadow h-14">
          <TabsTrigger value="social" className="rounded-xl font-bold flex gap-2 h-full">
            <Sparkles className="w-4 h-4" /> Social
          </TabsTrigger>
          <TabsTrigger value="messages" className="rounded-xl font-bold flex gap-2 h-full">
            <Send className="w-4 h-4" /> Messages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="social">
          <Card className="border-none kid-card-shadow bg-white rounded-3xl mb-6">
            <CardContent className="p-4 flex flex-col gap-3">
              <textarea 
                placeholder="What's on your mind? Mention @guru to ask me!" 
                className="w-full p-4 rounded-2xl border-none bg-slate-50 min-h-[100px] text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none" 
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
              />
              <Button 
                onClick={handlePost} 
                disabled={isPosting || !postContent} 
                className="rounded-xl bg-secondary font-bold h-12 w-full"
              >
                {isPosting ? <Loader2 className="animate-spin" /> : <><Plus className="w-4 h-4 mr-2" /> Share with Friends</>}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {isPostsLoading && (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
            )}
            {posts?.map((post) => {
              const hasLiked = post.likes?.includes(user?.uid);
              return (
                <Card key={post.id} className={`border-none kid-card-shadow bg-white rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 ${post.isGuruResponse ? 'border-2 border-primary/20' : ''}`}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden relative">
                        {post.userPhoto ? (
                          <Image src={post.userPhoto} alt={post.userName} fill className="object-cover" unoptimized />
                        ) : (
                          <User className="text-primary w-full h-full p-2" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-primary flex items-center gap-1">
                          {post.userName}
                          {post.isGuruResponse && <Sparkles className="w-3 h-3 text-secondary" />}
                        </h4>
                        <p className="text-[10px] text-muted-foreground font-medium">Student Explorer</p>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-slate-700 leading-relaxed mb-4 whitespace-pre-wrap">
                      {post.content}
                    </p>
                    <div className="flex gap-6 border-t pt-4">
                      <button 
                        onClick={() => toggleLike(post)}
                        className={`flex items-center gap-1.5 font-bold text-xs transition-colors ${hasLiked ? 'text-red-500' : 'text-slate-400'}`}
                      >
                        <Heart className={`w-4 h-4 ${hasLiked ? 'fill-red-500' : ''}`} /> {post.likes?.length || 0}
                      </button>
                      <button className="flex items-center gap-1.5 text-slate-400 font-bold text-xs hover:text-primary transition-colors">
                        <MessageCircle className="w-4 h-4" /> Comment
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="messages">
          {!selectedUser ? (
            <div className="space-y-4">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  className="pl-10 rounded-2xl border-none bg-white kid-card-shadow h-12" 
                  placeholder="Find a friend to chat..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="grid gap-4">
                {filteredUsers.map(u => (
                  <Card 
                    key={u.id} 
                    className="border-none kid-card-shadow bg-white rounded-2xl p-4 flex items-center gap-4 cursor-pointer active:scale-95 transition-transform"
                    onClick={() => setSelectedUser(u)}
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 relative overflow-hidden">
                      {u.photoURL ? (
                        <Image src={u.photoURL} alt={u.displayName} fill className="object-cover" unoptimized />
                      ) : (
                        <User className="w-full h-full p-3 text-primary" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-primary">{u.displayName || "Explorer"}</h4>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Tap to chat</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl kid-card-shadow flex flex-col h-[60vh] animate-in slide-in-from-right-4">
              <header className="p-4 border-b flex items-center gap-3 bg-primary text-white rounded-t-3xl">
                <button onClick={() => setSelectedUser(null)}><ArrowLeft className="w-5 h-5" /></button>
                <div className="w-8 h-8 rounded-full bg-white/20 relative overflow-hidden">
                  {selectedUser.photoURL ? <Image src={selectedUser.photoURL} alt="p" fill unoptimized /> : <User className="p-1" />}
                </div>
                <h4 className="font-bold">{selectedUser.displayName}</h4>
              </header>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeMessages.map(m => (
                  <div key={m.id} className={`flex ${m.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium ${m.senderId === user?.uid ? 'bg-primary text-white rounded-br-none' : 'bg-slate-100 text-slate-700 rounded-bl-none'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t flex gap-2">
                <Input 
                  className="rounded-xl bg-slate-50 border-none" 
                  placeholder="Type a message..." 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button size="icon" className="rounded-xl shrink-0" onClick={sendMessage}>
                  <Send className="w-4 h-4" />
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
