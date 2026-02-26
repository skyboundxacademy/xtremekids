
"use client"

import { BottomNav } from "@/components/BottomNav";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Send, Heart, MessageCircle, User, Sparkles, Loader2, Plus, Globe } from "lucide-react";
import { useState, useEffect } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, query, orderBy, serverTimestamp, getDocs, where } from "firebase/firestore";
import Image from "next/image";

export default function LabPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [activeTab, setActiveTab] = useState("social");
  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const postsQuery = useMemoFirebase(() => {
    return query(collection(db, "posts"), orderBy("timestamp", "desc"));
  }, [db]);

  const { data: posts, isLoading: isPostsLoading } = useCollection<any>(postsQuery);

  const handlePost = async () => {
    if (!user || !postContent) return;
    setIsPosting(true);
    await addDoc(collection(db, "posts"), {
      userId: user.uid,
      userName: user.displayName || "Explorer",
      content: postContent,
      likes: 0,
      timestamp: serverTimestamp()
    });
    setPostContent("");
    setIsPosting(false);
  };

  return (
    <main className="min-h-screen pb-24 px-4 pt-12 max-w-md mx-auto bg-slate-50">
      <header className="mb-6">
        <h1 className="text-3xl font-black text-primary flex items-center gap-2">
          Social Hub <Globe className="text-secondary animate-pulse" />
        </h1>
      </header>

      <Tabs defaultValue="social" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-white p-1 rounded-2xl kid-card-shadow h-14">
          <TabsTrigger value="social" className="rounded-xl font-bold flex gap-2 h-full">
            <Sparkles className="w-4 h-4" /> Discover
          </TabsTrigger>
          <TabsTrigger value="messages" className="rounded-xl font-bold flex gap-2 h-full">
            <MessageCircle className="w-4 h-4" /> Messages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="social">
          <Card className="border-none kid-card-shadow bg-white rounded-3xl mb-6">
            <CardContent className="p-4 flex flex-col gap-3">
              <Input 
                placeholder="What's on your mind?" 
                className="rounded-2xl border-primary/5 bg-slate-50 min-h-24 py-4" 
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
              />
              <Button 
                onClick={handlePost} 
                disabled={isPosting || !postContent} 
                className="rounded-xl bg-secondary font-bold h-12"
              >
                {isPosting ? <Loader2 className="animate-spin" /> : <><Plus className="w-4 h-4 mr-2" /> Post Now</>}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {isPostsLoading && (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
            )}
            {posts?.map((post) => (
              <Card key={post.id} className="border-none kid-card-shadow bg-white rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="text-primary w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-primary">{post.userName}</h4>
                      <p className="text-[10px] text-muted-foreground font-medium">Recently</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed mb-4">
                    {post.content}
                  </p>
                  <div className="flex gap-4 border-t pt-4">
                    <button className="flex items-center gap-1.5 text-slate-400 font-bold text-xs hover:text-red-500 transition-colors">
                      <Heart className="w-4 h-4" /> {post.likes || 0}
                    </button>
                    <button className="flex items-center gap-1.5 text-slate-400 font-bold text-xs hover:text-primary transition-colors">
                      <MessageCircle className="w-4 h-4" /> Comment
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="messages">
          <div className="bg-white p-6 rounded-3xl kid-card-shadow min-h-[400px] flex flex-col items-center justify-center text-center opacity-50">
            <MessageCircle className="w-16 h-16 text-primary mb-4" />
            <p className="font-bold text-primary">Chat coming soon!</p>
            <p className="text-xs font-medium">Message Kelechi and other co-founders here!</p>
          </div>
        </TabsContent>
      </Tabs>

      <BottomNav />
    </main>
  );
}
