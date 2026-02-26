
"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import { explainConcept } from "@/ai/flows/concept-explainer";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import Image from "next/image";

const GURU_AVATAR = "https://picsum.photos/seed/labubu-purple/400/400";

export function ProfessorSky() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const { user } = useUser();
  const db = useFirestore();

  const userRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc<any>(userRef);

  useEffect(() => {
    if (user && !isOpen) {
      const timer = setTimeout(() => setShowGreeting(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [user, isOpen]);

  const handleAsk = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await explainConcept({ concept: query });
      setResponse(res.explanation);
    } catch (e) {
      setResponse("My cosmic brain is a bit fuzzy! Try again!");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-24 right-4 z-[100]">
      {/* Icon is removed if isOpen is true, satisfying the "remove icon until close" requirement */}
      {!isOpen ? (
        <div className="relative group">
          {showGreeting && (
            <div className="absolute bottom-full right-0 mb-4 bg-white px-4 py-2 rounded-2xl kid-card-shadow border-2 border-purple-100 whitespace-nowrap animate-in slide-in-from-bottom-2 fade-in">
              <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">
                Hi, {profile?.displayName || "Explorer"}! 👋
              </p>
              <div className="absolute bottom-[-8px] right-6 w-4 h-4 bg-white border-r-2 border-b-2 border-purple-100 rotate-45" />
            </div>
          )}
          <button 
            onClick={() => { setIsOpen(true); setShowGreeting(false); }}
            className="w-20 h-20 hover:scale-110 transition-transform active:scale-95 flex items-center justify-center p-0 bg-transparent border-none"
          >
            <div className="relative w-20 h-20 drop-shadow-2xl">
              <Image 
                src={GURU_AVATAR} 
                alt="Guru" 
                fill 
                className="object-cover rounded-full border-4 border-white" 
                unoptimized 
              />
              <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-yellow-400 animate-pulse" />
            </div>
          </button>
        </div>
      ) : (
        <Card className="w-80 border-none kid-card-shadow overflow-hidden bg-white/95 backdrop-blur-md animate-in zoom-in-95 slide-in-from-bottom-5 rounded-[2.5rem] border-4 border-purple-100">
          <CardHeader className="bg-purple-600 p-4 flex flex-row items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
              <CardTitle className="text-xs font-black uppercase tracking-widest italic">Professor Sky</CardTitle>
            </div>
            <button className="text-white/60 hover:text-white" onClick={() => setIsOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </CardHeader>
          <CardContent className="p-4">
            <div className="max-h-60 overflow-y-auto mb-4 p-4 bg-purple-50 rounded-2xl text-[13px] font-bold leading-relaxed text-purple-900 min-h-[100px]">
              {response || "I'm ready to explain the mysteries of the universe! Ask me anything!"}
            </div>
            <div className="flex gap-2">
              <Input 
                className="h-12 text-xs rounded-2xl border-none bg-slate-100 italic" 
                placeholder="Talk to your guru..." 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              />
              <Button onClick={handleAsk} disabled={loading} size="icon" className="h-12 w-12 shrink-0 rounded-2xl bg-purple-600 shadow-lg shadow-purple-200">
                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
