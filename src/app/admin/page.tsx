
'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Sparkles, Loader2, BrainCircuit, CheckCircle2, AlertTriangle, Plus } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { collection, doc, addDoc, serverTimestamp } from "firebase/firestore";
import { generateDeepLesson } from "@/ai/flows/content-generator";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const SUBJECTS = [
  "Mathematics", "Further Mathematics", "English Language", "Literature-in-English", 
  "Physics", "Chemistry", "Biology", "Agricultural Science", "Economics", 
  "Geography", "Government", "Civic Education", "Financial Accounting", 
  "Commerce", "ICT / Data Processing", "Technical Drawing", "CRS / IRS", "Visual Arts"
];

const CLASSES = [
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
  "JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"
];

export default function AdminPage() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [lessonForm, setLessonForm] = useState({
    title: "",
    subject: "",
    targetClass: "",
    idea: "",
    imageUrl: "",
    description: "",
    steps: [] as any[]
  });

  const userProfileRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc<any>(userProfileRef);

  const isAdmin = user?.email === 'goddikrayz@gmail.com' || profile?.role === 'admin';

  useEffect(() => {
    if (!isUserLoading && !user) router.push('/login');
    if (!isUserLoading && user && profile && !isAdmin) router.push('/');
  }, [user, isUserLoading, router, profile, isAdmin]);

  const handleAiMagic = async () => {
    if (!lessonForm.title || !lessonForm.subject || !lessonForm.targetClass) {
      toast({ title: "Command Error", description: "Fill Title, Subject and Class first!" });
      return;
    }
    setLoading(true);
    toast({ title: "Architecting Course...", description: "Professor Sky is researching the scheme of work." });
    try {
      const result = await generateDeepLesson({
        title: lessonForm.title,
        subject: lessonForm.subject,
        targetClass: lessonForm.targetClass,
        idea: lessonForm.idea
      });
      setLessonForm(prev => ({
        ...prev,
        ...result,
        title: prev.title, // Keep the user's title if they prefer
        subject: prev.subject,
        targetClass: prev.targetClass
      }));
      toast({ title: "Academic Path Ready", description: "Self-healing images and polls generated." });
    } catch (e) {
      toast({ title: "AI Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (lessonForm.steps.length === 0) {
      toast({ title: "No Steps", description: "Trigger the AI architect or add steps first." });
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "lessons"), {
        ...lessonForm,
        createdAt: serverTimestamp()
      });
      toast({ title: "Academy Live", description: "Path is now open for students." });
      setLessonForm({ title: "", subject: "", targetClass: "", idea: "", imageUrl: "", description: "", steps: [] });
      router.push('/academy');
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <main className="min-h-screen bg-slate-50 p-6 max-w-4xl mx-auto pb-24">
      <header className="flex items-center gap-4 mb-8">
        <Link href="/profile"><Button variant="outline" size="icon" className="rounded-full"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <h1 className="text-2xl font-black text-primary uppercase italic tracking-tighter">Academic Command</h1>
      </header>

      <Card className="border-none kid-card-shadow bg-white p-8 rounded-[2.5rem] space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="font-bold">Lesson Title</Label>
            <Input value={lessonForm.title} onChange={e => setLessonForm(p => ({...p, title: e.target.value}))} placeholder="e.g. Physics of Flight" className="rounded-xl h-12" />
          </div>
          <div className="space-y-2">
            <Label className="font-bold">Subject</Label>
            <Select onValueChange={v => setLessonForm(p => ({...p, subject: v}))} value={lessonForm.subject}>
              <SelectTrigger className="rounded-xl h-12"><SelectValue placeholder="Subject" /></SelectTrigger>
              <SelectContent>
                {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="font-bold">Target Class</Label>
            <Select onValueChange={v => setLessonForm(p => ({...p, targetClass: v}))} value={lessonForm.targetClass}>
              <SelectTrigger className="rounded-xl h-12"><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>
                {CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-6 bg-primary/5 rounded-[2rem] border-2 border-dashed border-primary/20 text-center relative overflow-hidden">
          <BrainCircuit className="w-10 h-10 text-primary mx-auto mb-2" />
          <p className="text-xs font-bold text-primary mb-4 uppercase tracking-widest italic">Professor Sky will architect the entire scheme of work.</p>
          <Button onClick={handleAiMagic} disabled={loading} className="bg-primary hover:bg-primary/90 h-14 px-8 rounded-2xl font-black text-lg kid-card-shadow">
            {loading ? <Loader2 className="animate-spin" /> : <><Sparkles className="mr-2" /> TRIGGER MAGIC AI FILL</>}
          </Button>
        </div>

        {lessonForm.steps.length > 0 && (
          <div className="space-y-8 animate-in zoom-in-95 duration-500">
            <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
               <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0">
                  <Image src={lessonForm.imageUrl || `https://picsum.photos/seed/${lessonForm.title}/400/300`} alt="Card" fill className="object-cover" unoptimized />
               </div>
               <div>
                  <h3 className="font-black text-primary text-xl uppercase italic leading-tight">{lessonForm.title}</h3>
                  <p className="text-[10px] font-bold text-slate-400 italic mt-1">{lessonForm.description}</p>
               </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-black text-primary uppercase italic tracking-tighter">Academic Path Preview</h3>
              <div className="grid gap-4">
                {lessonForm.steps.map((step, i) => (
                  <div key={i} className="p-6 bg-white rounded-3xl border-2 border-slate-50 relative group hover:border-primary/20 transition-all">
                    <div className="flex justify-between items-start mb-4">
                       <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Section {i+1}</span>
                       <Badge variant="outline" className="text-[9px] font-black uppercase italic">{step.type}</Badge>
                    </div>
                    
                    <div className="flex gap-4">
                       {step.imageUrl && (
                         <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-slate-100 shadow-sm">
                            <Image src={step.imageUrl} alt="step" fill className="object-cover" unoptimized />
                         </div>
                       )}
                       <p className="text-xs font-medium text-slate-700 leading-relaxed flex-1">{step.content}</p>
                    </div>

                    {step.poll && (
                      <div className="mt-4 p-4 bg-secondary/5 rounded-2xl border border-secondary/10">
                         <p className="text-[10px] font-black text-secondary mb-2 uppercase italic">Knowledge Check</p>
                         <p className="text-xs font-bold mb-2">{step.poll.question}</p>
                         <div className="flex flex-wrap gap-2">
                            {step.poll.options.map((opt: string) => (
                              <div key={opt} className={cn("px-3 py-1 text-[9px] font-black rounded-lg border", opt === step.poll.correctAnswer ? "bg-green-50 text-green-600 border-green-100" : "bg-white border-slate-100")}>
                                {opt}
                              </div>
                            ))}
                         </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <Button onClick={handlePublish} disabled={loading} className="w-full h-16 bg-primary text-white font-black text-xl rounded-[2.5rem] kid-card-shadow shadow-primary/20 mt-8">
                PUBLISH ELITE PATH
              </Button>
            </div>
          </div>
        )}
      </Card>
    </main>
  );
}
