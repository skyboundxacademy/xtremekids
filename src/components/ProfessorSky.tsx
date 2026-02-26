
"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import { explainConcept } from "@/ai/flows/concept-explainer";
import { useUser } from "@/firebase";

export function ProfessorSky() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useUser();

  const handleAsk = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await explainConcept({ concept: query });
      setResponse(res.explanation);
    } catch (e) {
      setResponse("I'm thinking really hard right now! Try again in a second!");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-24 right-6 z-[100]">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-20 h-20 hover:scale-110 transition-transform active:scale-95 flex items-center justify-center p-0 bg-transparent border-none drop-shadow-2xl"
        >
          {/* Custom Purple Labubu / Character SVG - No Frame */}
          <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Ears */}
            <ellipse cx="35" cy="25" rx="10" ry="18" fill="#A855F7" />
            <ellipse cx="65" cy="25" rx="10" ry="18" fill="#A855F7" />
            <ellipse cx="35" cy="28" rx="5" ry="10" fill="#E9D5FF" />
            <ellipse cx="65" cy="28" rx="5" ry="10" fill="#E9D5FF" />
            {/* Head/Body */}
            <path d="M20 60C20 40 30 30 50 30C70 30 80 40 80 60C80 85 70 95 50 95C30 95 20 85 20 60Z" fill="#A855F7" />
            {/* Face */}
            <path d="M30 65C30 50 40 45 50 45C60 45 70 50 70 65C70 80 60 85 50 85C40 85 30 80 30 65Z" fill="#F3E8FF" />
            {/* Eyes */}
            <circle cx="42" cy="62" r="3" fill="#3B0764" />
            <circle cx="58" cy="62" r="3" fill="#3B0764" />
            {/* Mouth */}
            <path d="M45 72Q50 76 55 72" stroke="#3B0764" strokeWidth="2" strokeLinecap="round" />
            {/* Sparkles */}
            <path d="M15 30L18 33M18 30L15 33" stroke="#D64CE0" strokeWidth="2" strokeLinecap="round" />
            <path d="M85 45L88 48M88 45L85 48" stroke="#F473B3" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      ) : (
        <Card className="w-80 border-none kid-card-shadow overflow-hidden bg-white/95 backdrop-blur-md animate-in zoom-in-95 slide-in-from-bottom-5 rounded-[2.5rem]">
          <CardHeader className="bg-purple-600 p-4 flex flex-row items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <CardTitle className="text-sm font-black uppercase tracking-widest">Professor Sky</CardTitle>
            </div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-6 w-6" onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            <div className="max-h-60 overflow-y-auto mb-4 space-y-2">
              {response ? (
                <div className="bg-purple-50 p-4 rounded-2xl text-xs font-medium leading-relaxed text-purple-900 border border-purple-100">
                  "{response}"
                </div>
              ) : (
                <div className="text-purple-300 text-[10px] font-bold uppercase text-center py-8">
                  I'm ready to explain anything!
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Input 
                className="h-12 text-xs rounded-2xl border-purple-100 bg-slate-50" 
                placeholder="Ask your guru..." 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              />
              <Button onClick={handleAsk} disabled={loading} size="icon" className="h-12 w-12 shrink-0 rounded-2xl bg-purple-600">
                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
