
"use client"

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Sparkles, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { generateEncouragement } from "@/ai/flows/ai-encouragement";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc, query, where, getDocs } from "firebase/firestore";
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
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [checkingCompletion, setCheckingCompletion] = useState(true);

  // Check if user already finished this lesson
  useEffect(() => {
    if (!user || !lesson) return;
    
    const checkStatus = async () => {
      const q = query(
        collection(db, "submissions"),
        where("userId", "==", user.uid),
        where("taskTitle", "==", `Completed Lesson: ${lesson.title}`)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setIsCompleted(true);
      }
      setCheckingCompletion(false);
    };

    checkStatus();
  }, [user, lesson, db]);

  const handleFinish = async () => {
    if (!user || !lesson || isCompleted) return;
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
          toast({ title: "Well Done!" });
        }
        setIsCompleted(true);
        router.push('/academy');
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'submissions', operation: 'create', requestResourceData: submissionData }));
      })
      .finally(() => setIsSubmitting(false));
  };

  if (isLessonLoading || checkingCompletion) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!lesson) return <div className="p-10 text-center font-bold">Lesson not found</div>;

  return (
    <main className="min-h-screen bg-white max-w-md mx-auto relative pb-24">
      <button onClick={() => router.back()} className="fixed top-6 left-6 z-50 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center text-primary">
        <ChevronLeft className="w-6 h-6" />
      </button>

      <div className="relative h-72 w-full">
        <Image 
          src={lesson.imageUrl || `https://picsum.photos/seed/${lesson.id}/800/600`} 
          alt={lesson.title} 
          fill 
          className="object-cover" 
        />
      </div>

      <div className="px-6 -mt-12 relative z-10">
        <h1 className="text-3xl font-bold text-primary mb-6 bg-white/80 backdrop-blur-sm p-2 rounded-xl inline-block">{lesson.title}</h1>
        <div className="prose mb-10 text-muted-foreground font-medium leading-relaxed">{lesson.content}</div>

        <div className="flex gap-4">
          {isCompleted ? (
            <div className="w-full flex items-center justify-center gap-2 h-14 bg-green-500/10 text-green-600 rounded-2xl font-bold text-lg border-2 border-green-500/20">
              <CheckCircle2 className="w-6 h-6" /> Mission Already Done!
            </div>
          ) : (
            <Button onClick={handleFinish} disabled={isSubmitting} className="flex-1 rounded-2xl h-14 bg-secondary font-bold text-lg">
              {isSubmitting ? "Sending..." : "Finish & Earn Stars"} <ArrowRight className="ml-2" />
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
