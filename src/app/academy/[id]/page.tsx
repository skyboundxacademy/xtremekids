
"use client"

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { lessonKeyTakeaways } from "@/ai/flows/lesson-key-takeaways";
import { generateEncouragement } from "@/ai/flows/ai-encouragement";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function LessonDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();

  const lessonRef = useMemoFirebase(() => {
    return id ? doc(db, 'lessons', id as string) : null;
  }, [db, id]);

  const { data: lesson, isLoading: isLessonLoading } = useDoc<any>(lessonRef);
  
  const [takeaway, setTakeaway] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLessonLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );

  if (!lesson) return <div className="p-10 text-center font-bold">Lesson not found</div>;

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
    if (!user) return;
    setIsSubmitting(true);
    
    const submissionData = {
      userId: user.uid,
      userName: user.displayName || "Explorer",
      taskTitle: `Completed Lesson: ${lesson.title}`,
      points: 25,
      status: "pending",
      timestamp: serverTimestamp()
    };

    addDoc(collection(db, "submissions"), submissionData)
      .then(async () => {
        try {
          const msg = await generateEncouragement({
            childName: user.displayName || "Explorer",
            contentType: "lesson",
            contentTitle: lesson.title
          });
          toast({ title: "Mission Submitted!", description: msg.message });
        } catch (e) {
          toast({ title: "Well Done!", description: "Your teacher will mark your work soon!" });
        }
        router.push('/academy');
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ 
          path: 'submissions', 
          operation: 'create', 
          requestResourceData: submissionData 
        }));
      })
      .finally(() => setIsSubmitting(false));
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
        <Image src={lesson.imageUrl || "https://picsum.photos/seed/placeholder/600/400"} alt={lesson.title} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
      </div>

      <div className="px-6 -mt-12 relative z-10">
        <span className="bg-secondary/10 text-secondary text-[10px] font-bold uppercase py-1 px-3 rounded-full mb-3 inline-block">
          {lesson.category}
        </span>
        <h1 className="text-3xl font-bold text-primary mb-6">{lesson.title}</h1>
        
        <div className="prose prose-purple font-medium text-muted-foreground leading-relaxed mb-10 whitespace-pre-wrap">
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
            disabled={isSubmitting}
            className="flex-1 rounded-2xl h-14 bg-secondary hover:bg-secondary/90 shadow-lg font-bold text-lg"
          >
            {isSubmitting ? "Sending..." : "Finish Lesson"} <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </main>
  );
}
