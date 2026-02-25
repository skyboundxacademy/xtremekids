"use client"

import { useParams, useRouter } from "next/navigation";
import { mockLessons } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Sparkles, Wand2, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { lessonKeyTakeaways } from "@/ai/flows/lesson-key-takeaways";
import { explainConcept } from "@/ai/flows/concept-explainer";
import { generateEncouragement } from "@/ai/flows/ai-encouragement";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function LessonDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const lesson = mockLessons.find(l => l.id === id);
  
  const [takeaway, setTakeaway] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  if (!lesson) return <div>Lesson not found</div>;

  const handleSummarize = async () => {
    setIsSummarizing(true);
    try {
      const result = await lessonKeyTakeaways({ lessonContent: lesson.content });
      setTakeaway(result.summary);
    } catch (e) {
      toast({ title: "Oops!", description: "The AI is sleepy, try again later!", variant: "destructive" });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleFinish = async () => {
    try {
      const msg = await generateEncouragement({
        childName: "Explorer",
        contentType: "lesson",
        contentTitle: lesson.title
      });
      toast({ title: "Great Job!", description: msg.message });
      router.push('/academy');
    } catch (e) {
      router.push('/academy');
    }
  };

  return (
    <main className="min-h-screen bg-white max-w-md mx-auto relative pb-24">
      <button 
        onClick={() => router.back()}
        className="fixed top-6 left-6 z-50 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center text-primary"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <div className="relative h-72 w-full">
        <Image src={lesson.imageUrl} alt={lesson.title} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
      </div>

      <div className="px-6 -mt-12 relative z-10">
        <span className="bg-secondary/10 text-secondary text-[10px] font-bold uppercase py-1 px-3 rounded-full mb-3 inline-block">
          {lesson.category}
        </span>
        <h1 className="text-3xl font-bold text-primary mb-6">{lesson.title}</h1>
        
        <div className="prose prose-purple font-medium text-muted-foreground leading-relaxed mb-10">
          <p>{lesson.content}</p>
        </div>

        <div className="space-y-4 mb-10">
          <Button 
            onClick={handleSummarize} 
            disabled={isSummarizing}
            className="w-full rounded-2xl h-14 bg-primary hover:bg-primary/90 gap-2 shadow-lg"
          >
            <Sparkles className="w-5 h-5" /> 
            {isSummarizing ? "Thinking..." : "What did we learn?"}
          </Button>

          {takeaway && (
            <Card className="bg-primary/5 border-dashed border-2 border-primary/20 rounded-3xl overflow-hidden animate-in slide-in-from-bottom-4">
              <CardContent className="p-6">
                <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
                  Professor Sky says:
                </h4>
                <p className="text-sm font-medium leading-relaxed italic">"{takeaway}"</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex gap-4">
          <Button 
            onClick={handleFinish}
            className="flex-1 rounded-2xl h-14 bg-secondary hover:bg-secondary/90 shadow-lg font-bold text-lg"
          >
            Finish Lesson <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </main>
  );
}