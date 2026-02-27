
"use client"

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Sparkles, ArrowRight, ArrowLeft, Loader2, CheckCircle2, Award, HelpCircle } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc, query, where, getDocs } from "firebase/firestore";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function LessonDetailPage() {
  const { id, category, targetClass } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const lessonRef = useMemoFirebase(() => (id && user) ? doc(db, 'lessons', id as string) : null, [db, id, user]);
  const { data: lesson, isLoading: isLessonLoading } = useDoc<any>(lessonRef);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [checkingCompletion, setCheckingCompletion] = useState(true);
  
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !lesson) return;
    const checkStatus = async () => {
      try {
        const q = query(
          collection(db, "submissions"),
          where("userId", "==", user.uid),
          where("taskTitle", "==", `Completed Lesson: ${lesson.title}`)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) setIsCompleted(true);
      } catch (e) {
        console.warn("Status check failed", e);
      } finally {
        setCheckingCompletion(false);
      }
    };
    checkStatus();
  }, [user, lesson, db]);

  const handlePollSubmit = (option: string, correct: string, feedback: string) => {
    setSelectedOption(option);
    if (option !== correct) {
      setAiFeedback(feedback);
    } else {
      setAiFeedback(null);
      toast({ title: "Brilliant!", description: "You got it exactly right." });
    }
  };

  const handleNext = () => {
    if (!lesson?.steps) return;
    const step = lesson.steps[currentStep];
    if (step.type === 'poll' && !selectedOption) {
      toast({ title: "Wait!", description: "Professor Sky needs your answer first!" });
      return;
    }
    if (currentStep < lesson.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setSelectedOption(null);
      setAiFeedback(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isUserLoading || isLessonLoading || checkingCompletion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-10 text-center">
        <Loader2 className="animate-spin text-primary mb-4" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Preparing Elite Academic Path...</p>
      </div>
    );
  }

  if (!lesson || !lesson.steps || lesson.steps.length === 0 || !lesson.steps[currentStep]) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center space-y-4">
        <HelpCircle className="w-12 h-12 text-slate-200" />
        <h2 className="font-black text-slate-400 uppercase tracking-widest italic text-xs">This Academic Path is still being built by the Architect.</h2>
        <Button onClick={() => router.back()} variant="outline" className="rounded-full">Go Back</Button>
      </div>
    );
  }

  const step = lesson.steps[currentStep];
  const progress = ((currentStep + 1) / lesson.steps.length) * 100;

  const handleFinish = async () => {
    if (!user || !lesson || isCompleted) return;
    setIsSubmitting(true);

    const submissionData = {
      userId: user.uid,
      userName: user.displayName || "Explorer",
      taskTitle: `Completed Lesson: ${lesson.title}`,
      points: 100, 
      status: "approved",
      timestamp: serverTimestamp()
    };

    try {
      await addDoc(collection(db, "submissions"), submissionData);
      toast({ title: "Excellence Achieved!", description: "You've earned your Certificate!" });
      setIsCompleted(true);
      router.push('/academy');
    } catch (e) {
      toast({ title: "Submission Failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white max-w-md mx-auto relative pb-32">
      <button onClick={() => router.back()} className="fixed top-6 left-6 z-[70] w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center text-primary">
        <ChevronLeft className="w-6 h-6" />
      </button>

      <div className="relative h-64 w-full">
        <Image 
          src={step.imageUrl || lesson.imageUrl || `https://picsum.photos/seed/${lesson.title}/800/600`} 
          alt="Step Image" 
          fill 
          className="object-cover transition-all duration-700" 
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
           <h1 className="text-2xl font-black text-white leading-tight">{lesson.title}</h1>
           <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-2">Section {currentStep + 1}</span>
        </div>
      </div>

      <div className="px-8 pt-8">
        <div className="mb-10">
           <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">{lesson.subject} / Path {currentStep + 1}</span>
            <span className="text-[10px] font-black text-primary">{Math.round(progress)}%</span>
           </div>
           <Progress value={progress} className="h-2 rounded-full bg-primary/10" />
        </div>

        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="prose prose-sm font-medium leading-relaxed text-slate-700 whitespace-pre-wrap mb-10 text-base italic">
            {step.content}
          </div>

          {step.type === 'poll' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4 text-secondary">
                <HelpCircle className="w-5 h-5" />
                <h4 className="font-black text-lg italic tracking-tight uppercase">{step.poll?.question || "Knowledge Check"}</h4>
              </div>
              <div className="grid gap-3">
                {step.poll?.options?.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => handlePollSubmit(opt, step.poll.correctAnswer, step.poll.explanation)}
                    className={cn(
                      "w-full p-5 rounded-2xl text-left font-bold text-sm transition-all border-2",
                      selectedOption === opt 
                        ? (opt === step.poll.correctAnswer ? "bg-green-500/10 border-green-500 text-green-700" : "bg-red-500/10 border-red-500 text-red-700")
                        : "bg-slate-50 border-slate-100 hover:border-primary/30"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {aiFeedback && (
                <div className="mt-6 p-6 bg-purple-600 rounded-3xl text-white relative shadow-xl shadow-purple-200 animate-in zoom-in-95">
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span className="text-[10px] font-black uppercase tracking-widest italic">Professor Sky Explains</span>
                  </div>
                  <p className="text-xs font-bold leading-relaxed">{aiFeedback}</p>
                  <div className="absolute top-[-8px] right-10 w-4 h-4 bg-purple-600 rotate-45" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t p-6 flex gap-4 max-w-md mx-auto z-[60]">
          {currentStep > 0 && (
            <Button onClick={() => setCurrentStep(prev => prev - 1)} variant="outline" className="flex-1 rounded-2xl h-14 font-black border-primary/20 text-primary">
              <ArrowLeft className="mr-2" />
            </Button>
          )}
          
          {currentStep < (lesson.steps?.length || 0) - 1 ? (
            <Button onClick={handleNext} className="flex-[2] rounded-2xl h-14 bg-primary font-black text-lg kid-card-shadow uppercase italic tracking-tighter">
              Next Path <ArrowRight className="ml-2" />
            </Button>
          ) : (
            <div className="flex-[2]">
              {isCompleted ? (
                <div className="w-full flex items-center justify-center gap-2 h-14 bg-green-500/10 text-green-600 rounded-2xl font-black border-2 border-green-500/20 uppercase">
                  <CheckCircle2 className="w-6 h-6" /> Certified
                </div>
              ) : (
                <Button onClick={handleFinish} disabled={isSubmitting} className="w-full rounded-2xl h-14 bg-secondary font-black text-lg kid-card-shadow uppercase italic">
                  {isSubmitting ? "Certifying..." : "Complete Path"} <Award className="ml-2" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
