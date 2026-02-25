"use client"

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Sparkles, ArrowRight, Loader2, CheckCircle2, Award } from "lucide-react";
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
      points: 0, 
      rewardType: 'badge',
      status: "pending",
      timestamp: serverTimestamp()
    };

    // Non-blocking Firestore write
    addDoc(collection(db, "submissions"), submissionData)
      .then(async () => {
        // AI Encouragement is separate and asynchronous
        try {
          await generateEncouragement({
            childName: user.displayName || "Explorer",
            contentType: "lesson",
            contentTitle: lesson.title
          });
        } catch (e) {
          // AI errors shouldn't break the lesson flow
        }
        
        toast({ title: "Lesson Finished!", description: "Professor Sky will award your badge soon!" });
        setIsCompleted(true);
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

  if (isLessonLoading || checkingCompletion) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!lesson) return <div className="p-10 text-center font-bold">Lesson not found</div>;

  return (
    <main className="min-h-screen bg-white max-w-md mx-auto relative pb-24">
      <button onClick={() => router.back()} className="fixed top-6 left-6 z-50 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center text-primary">
        <ChevronLeft className="w-6 h-6" />
      </button>

      <div className="relative h-72 w-full">
        <Image 
          src={lesson.imageUrl || `https://picsum.photos/seed/${lesson.title}/800/600`} 
          alt={lesson.title} 
          fill 
          className="object-cover" 
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
          <h1 className="text-3xl font-black text-white leading-tight">{lesson.title}</h1>
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="flex items-center gap-2 mb-8 bg-secondary/10 p-4 rounded-2xl border-2 border-dashed border-secondary/20">
          <Award className="text-secondary w-6 h-6" />
          <div>
            <p className="text-[10px] font-bold uppercase text-secondary">Reward</p>
            <p className="font-bold text-sm">Earn the "{lesson.title}" Badge</p>
          </div>
        </div>

        {/* LONG FORM ACADEMIC CONTENT */}
        <div className="prose prose-sm font-medium leading-relaxed text-slate-700 whitespace-pre-wrap">
          {lesson.content}
        </div>

        <div className="mt-12">
          {isCompleted ? (
            <div className="w-full flex items-center justify-center gap-2 h-14 bg-green-500/10 text-green-600 rounded-2xl font-bold text-lg border-2 border-green-500/20">
              <CheckCircle2 className="w-6 h-6" /> Mission Already Done!
            </div>
          ) : (
            <Button onClick={handleFinish} disabled={isSubmitting} className="w-full rounded-2xl h-14 bg-primary font-bold text-lg kid-card-shadow">
              {isSubmitting ? "Sending..." : "Finish & Earn Badge"} <ArrowRight className="ml-2" />
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
