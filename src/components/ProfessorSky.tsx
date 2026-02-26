
"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sparkles, MessageCircle, X, Send, Loader2 } from "lucide-react";
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
        <Button 
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full bg-primary shadow-2xl hover:scale-110 transition-transform p-0 flex items-center justify-center border-4 border-white"
        >
          {/* Korean Baby Doll Style Icon (SVG) */}
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" fill="white"/>
            <path d="M10 20C10 14.4772 14.4772 10 20 10C25.5228 10 30 14.4772 30 20" stroke="#D64CE0" strokeWidth="4" strokeLinecap="round"/>
            <circle cx="15" cy="20" r="2" fill="#D64CE0"/>
            <circle cx="25" cy="20" r="2" fill="#D64CE0"/>
            <path d="M18 26C18 26 19 28 20 28C21 28 22 26 22 26" stroke="#D64CE0" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </Button>
      ) : (
        <Card className="w-80 border-none kid-card-shadow overflow-hidden bg-white/95 backdrop-blur-sm animate-in zoom-in-95 slide-in-from-bottom-5">
          <CardHeader className="bg-primary p-4 flex flex-row items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Professor Sky</CardTitle>
            </div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-6 w-6" onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            <div className="max-h-60 overflow-y-auto mb-4 space-y-2">
              {response ? (
                <div className="bg-primary/5 p-3 rounded-xl text-xs font-medium leading-relaxed italic">
                  "{response}"
                </div>
              ) : (
                <div className="text-muted-foreground text-[10px] font-bold uppercase text-center py-4">
                  How can I help you learn today?
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Input 
                className="h-10 text-xs rounded-xl border-primary/10" 
                placeholder="Ask me anything..." 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              />
              <Button onClick={handleAsk} disabled={loading} size="icon" className="h-10 w-10 shrink-0 rounded-xl bg-secondary">
                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
