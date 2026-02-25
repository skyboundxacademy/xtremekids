"use client"

import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FlaskConical, Beaker, Wand2, Lightbulb, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { explainConcept } from "@/ai/flows/concept-explainer";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function LabPage() {
  const [concept, setConcept] = useState("");
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleExplain = async () => {
    if (!concept) return;
    setLoading(true);
    try {
      const res = await explainConcept({ concept });
      setExplanation(res.explanation);
    } catch (e) {
      toast({ title: "Oops!", description: "Professor Sky is busy researching!", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen pb-24 px-6 pt-12 max-w-md mx-auto">
      <header className="mb-10 text-center">
        <div className="w-20 h-20 bg-white rounded-3xl kid-card-shadow mx-auto flex items-center justify-center mb-4 relative">
          <Sparkles className="w-10 h-10 text-primary animate-pulse" />
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-secondary rounded-full flex items-center justify-center text-white text-[10px] font-bold">!</div>
        </div>
        <h1 className="text-3xl font-bold text-primary mb-2">The Guru Lab</h1>
        <p className="text-muted-foreground font-medium">Ask Professor Sky Anything!</p>
      </header>

      <section className="mb-10">
        <Card className="bg-white border-none kid-card-shadow overflow-hidden rounded-[2rem] relative">
          <div className="diary-tape bg-secondary/30" />
          <CardContent className="p-8">
            <h3 className="text-xl font-black text-primary mb-4 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-secondary" /> Academic Guru
            </h3>
            <p className="text-sm text-muted-foreground mb-6 font-medium">
              Stuck on a homework question? Want to know how the sun works? Just ask!
            </p>
            
            <div className="flex flex-col gap-2 mb-6">
              <Input 
                className="rounded-xl border-primary/10 bg-primary/5 focus-visible:ring-primary h-14 text-lg" 
                placeholder="Ask your question here..." 
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExplain()}
              />
              <Button 
                onClick={handleExplain} 
                disabled={loading || !concept}
                className="rounded-xl h-14 bg-secondary font-bold text-lg"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Answer Me!"}
              </Button>
            </div>

            {explanation && (
              <div className="bg-primary/5 p-6 rounded-2xl border-2 border-dashed border-primary/20 animate-in slide-in-from-bottom-5">
                <p className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" /> Guru's Wisdom:
                </p>
                <div className="text-sm italic leading-relaxed text-slate-700 whitespace-pre-wrap">
                  "{explanation}"
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <Card className="bg-white border-none kid-card-shadow rounded-[2rem] p-6 flex flex-col items-center text-center">
          <div className="bg-primary/10 p-4 rounded-full mb-3">
            <Beaker className="text-primary w-6 h-6" />
          </div>
          <h4 className="font-bold text-sm text-primary">Science Help</h4>
          <span className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Available</span>
        </Card>
        <Card className="bg-white border-none kid-card-shadow rounded-[2rem] p-6 flex flex-col items-center text-center">
          <div className="bg-secondary/10 p-4 rounded-full mb-3">
            <Lightbulb className="text-secondary w-6 h-6" />
          </div>
          <h4 className="font-bold text-sm text-secondary">Math Magic</h4>
          <span className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Available</span>
        </Card>
      </section>

      <BottomNav />
    </main>
  );
}
