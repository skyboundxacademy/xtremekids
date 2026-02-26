
"use client"

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Sparkles, ArrowRight, ArrowLeft, Loader2, CheckCircle2, Award } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc, query, where, getDocs } from "firebase/firestore";
import { Progress } from "@/components/ui/progress";

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
  
  const [currentStep, setCurrentStep] = useState(0);
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
      if (!snapshot.empty) setIsCompleted(true);
      setCheckingCompletion(false);
    };
    checkStatus();
  }, [user, lesson, db]);

  const handleFinish = async () => {
    if (!user || !lesson || isCompleted) return;
    setIsSubmitting(true);

    // AD TRIGGER: MONETAG AD PLACEHOLDER (Show ad before rewarding)

    const submissionData = {
      userId: user.uid,
      userName: user.displayName || "Explorer",
      taskTitle: `Completed Lesson: ${lesson.title}`,
      points: 0, 
      rewardType: 'badge',
      status: "pending",
      timestamp: serverTimestamp()
    };

    addDoc(collection(db, "submissions"), submissionData)
      .then(() => {
        toast({ title: "Lesson Finished!", description: "Professor Sky will award your badge soon!" });
        setIsCompleted(true);
        router.push('/academy');
      })
      .finally(() => setIsSubmitting(false));
  };

  if (isLessonLoading || checkingCompletion) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!lesson) return <div className="p-10 text-center font-bold">Lesson not found</div>;

  const steps = lesson.steps || [lesson.content]; // Fallback if no steps array
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <main className="min-h-screen bg-white max-w-md mx-auto relative pb-32">
      <button onClick={() => router.back()} className="fixed top-6 left-6 z-50 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center text-primary">
        <ChevronLeft className="w-6 h-6" />
      </button>

      <div className="relative h-60 w-full">
        <Image 
          src={lesson.imageUrl || `https://picsum.photos/seed/${lesson.title}/800/600`} 
          alt={lesson.title} 
          fill 
          className="object-cover" 
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
          <h1 className="text-2xl font-black text-white">{lesson.title}</h1>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="mb-8">
           <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-primary uppercase">Content {currentStep + 1} of {steps.length}</span>
            <span className="text-[10px] font-bold text-primary">{Math.round(progress)}%</span>
           </div>
           <Progress value={progress} className="h-2 rounded-full bg-primary/10" />
        </div>

        <div className="prose prose-sm font-medium leading-relaxed text-slate-700 whitespace-pre-wrap min-h-[300px] animate-in fade-in slide-in-from-right-2">
          {steps[currentStep]}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t p-6 flex gap-4 max-w-md mx-auto">
          {currentStep > 0 && (
            <Button onClick={() => setCurrentStep(prev => prev - 1)} variant="outline" className="flex-1 rounded-2xl h-14 font-bold border-primary/20 text-primary">
              <ArrowLeft className="mr-2" /> Back
            </Button>
          )}
          
          {currentStep < steps.length - 1 ? (
            <Button onClick={() => setCurrentStep(prev => prev + 1)} className="flex-1 rounded-2xl h-14 bg-primary font-bold text-lg kid-card-shadow">
              Next Step <ArrowRight className="ml-2" />
            </Button>
          ) : (
            <div className="flex-1">
              {isCompleted ? (
                <div className="w-full flex items-center justify-center gap-2 h-14 bg-green-500/10 text-green-600 rounded-2xl font-bold border-2 border-green-500/20">
                  <CheckCircle2 className="w-6 h-6" /> Already Done!
                </div>
              ) : (
                <Button onClick={handleFinish} disabled={isSubmitting} className="w-full rounded-2xl h-14 bg-primary font-bold text-lg kid-card-shadow">
                  {isSubmitting ? "Finishing..." : "Complete & Earn"} <Award className="ml-2" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
