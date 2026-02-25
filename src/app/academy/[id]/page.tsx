
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

  // MONETAG AD PLACEHOLDER
  const showAd = () => {
    console.log("TRIGGER MONETAG AD FOR START LESSON");
    // Tochi: When you get your Monetag script, you will call it here.
  };

  if (isLessonLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!lesson) return <div className="p-10 text-center font-bold">Lesson not found</div>;

  const handleFinish = async () => {
    if (!user) return;
    setIsSubmitting(true);
    showAd(); // Show ad on access attempt

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
          toast({ title: "Well Done!" });
        }
        router.push('/academy');
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'submissions', operation: 'create', requestResourceData: submissionData }));
      })
      .finally(() => setIsSubmitting(false));
  };

  return (
    <main className="min-h-screen bg-white max-w-md mx-auto relative pb-24">
      <button onClick={() => router.back()} className="fixed top-6 left-6 z-50 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center text-primary">
        <ChevronLeft className="w-6 h-6" />
      </button>

      <div className="relative h-72 w-full">
        <Image src={lesson.imageUrl || "https://picsum.photos/seed/placeholder/600/400"} alt={lesson.title} fill className="object-cover" />
      </div>

      <div className="px-6 -mt-12 relative z-10">
        <h1 className="text-3xl font-bold text-primary mb-6">{lesson.title}</h1>
        <div className="prose mb-10 text-muted-foreground font-medium">{lesson.content}</div>

        <div className="flex gap-4">
          <Button onClick={handleFinish} disabled={isSubmitting} className="flex-1 rounded-2xl h-14 bg-secondary font-bold text-lg">
            {isSubmitting ? "Sending..." : "Finish & Earn Stars"} <ArrowRight className="ml-2" />
          </Button>
        </div>
      </div>
    </main>
  );
}
