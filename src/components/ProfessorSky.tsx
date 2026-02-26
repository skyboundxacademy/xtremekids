
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
      setResponse("My cosmic brain is a bit fuzzy! Try again!");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-24 right-4 z-[100]">
      {/* Icon is only shown when the interface is NOT open */}
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-20 h-20 hover:scale-110 transition-transform active:scale-95 flex items-center justify-center p-0 bg-transparent border-none"
        >
          <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
            <ellipse cx="35" cy="20" rx="8" ry="20" fill="#9333ea" />
            <ellipse cx="65" cy="20" rx="8" ry="20" fill="#9333ea" />
            <ellipse cx="35" cy="22" rx="4" ry="12" fill="#e9d5ff" />
            <ellipse cx="65" cy="22" rx="4" ry="12" fill="#e9d5ff" />
            <path d="M20 60C20 40 30 30 50 30C70 30 80 40 80 60C80 85 70 95 50 95C30 95 20 85 20 60Z" fill="#9333ea" />
            <path d="M30 65C30 50 40 45 50 45C60 45 70 50 70 65C70 80 60 85 50 85C40 85 30 80 30 65Z" fill="#FDF4FF" />
            <circle cx="42" cy="62" r="4" fill="#1e1b4b" />
            <circle cx="58" cy="62" r="4" fill="#1e1b4b" />
            <circle cx="41" cy="61" r="1.5" fill="white" />
            <circle cx="57" cy="61" r="1.5" fill="white" />
            <path d="M44 74Q50 79 56 74" stroke="#1e1b4b" strokeWidth="3" strokeLinecap="round" />
            <path d="M12 35L16 39M16 35L12 39" stroke="#d946ef" strokeWidth="2" strokeLinecap="round" />
            <path d="M84 40L88 44M88 40L84 44" stroke="#c026d3" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
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
