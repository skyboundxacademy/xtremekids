
'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Sparkles, Loader2, Plus, Trash2, BookOpen, BrainCircuit } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { collection, doc, addDoc, serverTimestamp } from "firebase/firestore";
import { generateDeepLesson } from "@/ai/flows/content-generator";

const SUBJECTS = ["Mathematics", "English", "Science", "Social Studies", "ICT", "Physics", "Chemistry", "Biology", "Economics"];
const CLASSES = ["Primary 1-6", "JSS 1-3", "SSS 1-3"];

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
      toast({ title: "Missing Data", description: "Fill Title, Subject and Class first!" });
      return;
    }
    setLoading(true);
    toast({ title: "Professor Sky is Thinking...", description: "Building a world-class scheme of work..." });
    try {
      const result = await generateDeepLesson({
        title: lessonForm.title,
        subject: lessonForm.subject,
        targetClass: lessonForm.targetClass,
        idea: lessonForm.idea
      });
      setLessonForm(prev => ({
        ...prev,
        ...result
      }));
      toast({ title: "AI Generation Complete!", description: "Review the steps below then click Publish." });
    } catch (e) {
      toast({ title: "AI Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (lessonForm.steps.length === 0) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "lessons"), {
        ...lessonForm,
        createdAt: serverTimestamp()
      });
      toast({ title: "Academy Updated!", description: "Lesson is live for students." });
      setLessonForm({ title: "", subject: "", targetClass: "", idea: "", imageUrl: "", steps: [] });
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <main className="min-h-screen bg-slate-50 p-6 max-w-4xl mx-auto pb-24">
      <header className="flex items-center gap-4 mb-8">
        <Link href="/profile"><Button variant="outline" size="icon" className="rounded-full"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <h1 className="text-2xl font-black text-primary uppercase italic tracking-tighter">Command Center</h1>
      </header>

      <Card className="border-none kid-card-shadow bg-white p-8 rounded-[2.5rem] space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="font-bold">Lesson Title</Label>
            <Input value={lessonForm.title} onChange={e => setLessonForm(p => ({...p, title: e.target.value}))} placeholder="e.g. Introduction to HTML" className="rounded-xl h-12" />
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

        <div className="p-6 bg-primary/5 rounded-3xl border-2 border-dashed border-primary/20 text-center relative">
          <BrainCircuit className="w-10 h-10 text-primary mx-auto mb-2" />
          <p className="text-sm font-bold text-primary mb-4">Let AI build the entire academic content for you.</p>
          <Button onClick={handleAiMagic} disabled={loading} className="bg-primary hover:bg-primary/90 h-14 px-8 rounded-2xl font-black text-lg">
            {loading ? <Loader2 className="animate-spin" /> : <><Sparkles className="mr-2" /> MAGIC AI FILL</>}
          </Button>
        </div>

        {lessonForm.steps.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-xl font-black text-primary uppercase italic">Lesson Steps Preview</h3>
            <div className="space-y-4">
              {lessonForm.steps.map((step, i) => (
                <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                  <div className="absolute top-4 right-4 text-[10px] font-black text-slate-300 uppercase">Step {i+1} - {step.type}</div>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed mb-4">{step.content}</p>
                  {step.imageUrl && <div className="text-[9px] font-bold text-primary">Image: {step.imageUrl}</div>}
                  {step.poll && (
                    <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200">
                      <p className="text-xs font-black text-secondary mb-2 italic">POLL: {step.poll.question}</p>
                      <div className="flex gap-2">
                        {step.poll.options.map((opt: string) => <div key={opt} className="px-3 py-1 bg-slate-50 text-[10px] font-bold rounded-lg border">{opt}</div>)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Button onClick={handlePublish} disabled={loading} className="w-full h-16 bg-secondary text-white font-black text-xl rounded-[2rem] shadow-xl shadow-secondary/20">
              PUBLISH ELITE LESSON
            </Button>
          </div>
        )}
      </Card>
    </main>
  );
}
