
'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Sparkles, Loader2, BrainCircuit, Trash2, Plus, Wand2, BookOpen, GraduationCap, CheckCircle2 } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";

const SUBJECTS = [
  "Mathematics", "Further Mathematics", "English Language", "Literature-in-English", 
  "Physics", "Chemistry", "Biology", "Agricultural Science", "Economics", 
  "Geography", "Government", "Civic Education", "Financial Accounting", 
  "Commerce", "ICT / Data Processing", "Technical Drawing", "CRS / IRS", "Visual Arts",
  "Basic Science", "Basic Technology", "Social Studies", "Home Economics", "Physical and Health Education",
  "French", "Igbo", "Yoruba", "Hausa", "Arabic"
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
  const [aiArchitectStatus, setAiArchitectStatus] = useState<"idle" | "building" | "ready">("idle");
  
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
      toast({ title: "Architecting Error", description: "Please provide a Title, Subject, and Class first." });
      return;
    }
    setLoading(true);
    setAiArchitectStatus("building");
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
      }));
      setAiArchitectStatus("ready");
      toast({ title: "Path Architected!", description: "Professor Sky has mapped out a deep interactive path." });
    } catch (e) {
      toast({ title: "Architecting Failed", variant: "destructive" });
      setAiArchitectStatus("idle");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (lessonForm.steps.length === 0) {
      toast({ title: "Incomplete Path", description: "Please add steps manually or use the AI Architect." });
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "lessons"), {
        ...lessonForm,
        createdAt: serverTimestamp(),
        category: lessonForm.subject // Aligning category with subject for browse logic
      });
      toast({ title: "Academy Live!", description: "The path is now available for global students." });
      router.push('/academy');
    } catch (e) {
      toast({ title: "Publishing Failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-[1400px] mx-auto p-6 lg:p-10">
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <Link href="/profile">
              <Button variant="outline" size="icon" className="rounded-full w-12 h-12 border-primary/20 bg-white shadow-sm">
                <ArrowLeft className="w-5 h-5 text-primary" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-black text-primary uppercase italic tracking-tighter leading-none">Command Center</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Architecting High-IQ Futures</p>
            </div>
          </div>
          <Button onClick={handlePublish} disabled={loading || lessonForm.steps.length === 0} className="rounded-2xl h-14 px-10 bg-primary font-black text-lg kid-card-shadow uppercase italic tracking-tighter">
            {loading ? <Loader2 className="animate-spin mr-2" /> : <><CheckCircle2 className="mr-2" /> Publish Path</>}
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Manual Form */}
          <div className="lg:col-span-7 space-y-8">
            <Card className="border-none kid-card-shadow bg-white p-8 rounded-[2.5rem] space-y-8">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-black text-slate-800 uppercase italic">Teacher's Desk</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest text-slate-400">Lesson Title</Label>
                  <Input value={lessonForm.title} onChange={e => setLessonForm(p => ({...p, title: e.target.value}))} placeholder="e.g. Intro to Web Development" className="rounded-xl h-14 bg-slate-50 border-none font-bold italic" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest text-slate-400">Academic Level</Label>
                  <Select onValueChange={v => setLessonForm(p => ({...p, targetClass: v}))} value={lessonForm.targetClass}>
                    <SelectTrigger className="rounded-xl h-14 bg-slate-50 border-none font-bold italic"><SelectValue placeholder="Select Class" /></SelectTrigger>
                    <SelectContent>
                      {CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest text-slate-400">Subject Category</Label>
                <Select onValueChange={v => setLessonForm(p => ({...p, subject: v}))} value={lessonForm.subject}>
                  <SelectTrigger className="rounded-xl h-14 bg-slate-50 border-none font-bold italic"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-80">
                      {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest text-slate-400">Focus / Core Concept (Optional)</Label>
                <Input value={lessonForm.idea} onChange={e => setLessonForm(p => ({...p, idea: e.target.value}))} placeholder="e.g. Focus on HTML tags and visual design" className="rounded-xl h-14 bg-slate-50 border-none font-bold italic" />
              </div>

              {lessonForm.steps.length > 0 && (
                <div className="space-y-6 pt-6 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-black text-primary uppercase italic">Lesson Preview</h3>
                    <Button variant="ghost" className="text-rose-500 font-black text-[10px] uppercase" onClick={() => setLessonForm(p => ({...p, steps: []}))}>
                      <Trash2 className="w-4 h-4 mr-1" /> Clear Path
                    </Button>
                  </div>
                  <div className="grid gap-4">
                    {lessonForm.steps.map((step, i) => (
                      <div key={i} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 relative group transition-all">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Section {i+1}</span>
                          <Badge className="bg-white text-primary border-primary/20 uppercase text-[9px] font-black">{step.type}</Badge>
                        </div>
                        <div className="flex gap-4">
                          {step.imageUrl && (
                            <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 shadow-sm border border-white">
                              <Image src={step.imageUrl} alt="preview" fill className="object-cover" unoptimized />
                            </div>
                          )}
                          <div className="flex-1 space-y-2">
                            <p className="text-xs font-medium text-slate-700 leading-relaxed italic line-clamp-3">{step.content}</p>
                            {step.poll && <Badge variant="secondary" className="bg-secondary/10 text-secondary uppercase text-[8px] font-black">Interactive Poll Included</Badge>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* AI Architect Panel */}
          <div className="lg:col-span-5">
            <Card className="border-none kid-card-shadow bg-primary rounded-[3rem] p-8 text-white h-full relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 p-10 opacity-10">
                <BrainCircuit className="w-64 h-64" />
              </div>
              
              <div className="relative z-10 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center relative overflow-hidden">
                    <Image src="https://picsum.photos/seed/labubu-purple/400/400" alt="Guru" fill className="object-cover" unoptimized />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Professor Sky</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Architectural AI Assistant</p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-[2rem] p-6 mb-8 border border-white/10">
                  <p className="text-sm font-bold leading-relaxed italic">
                    {aiArchitectStatus === "idle" && "I'm ready to architect the highest-IQ educational path. Type in your course details and click 'Magic Fill'!"}
                    {aiArchitectStatus === "building" && "Architecting the academic journey... researching global schemes of work and generating interactive polls."}
                    {aiArchitectStatus === "ready" && "The Path is ready! I've included 10 deep academic steps, real visual references, and interactive checks."}
                  </p>
                </div>

                {aiArchitectStatus === "idle" && (
                  <Button onClick={handleAiMagic} disabled={loading || !lessonForm.title} className="w-full h-16 bg-white text-primary hover:bg-white/90 rounded-[2rem] font-black text-xl shadow-xl shadow-primary/40 uppercase italic tracking-tighter transition-all">
                    {loading ? <Loader2 className="animate-spin" /> : <><Wand2 className="mr-2" /> MAGIC AI FILL</>}
                  </Button>
                )}

                {aiArchitectStatus === "ready" && (
                  <div className="space-y-4">
                    <Button onClick={handleAiMagic} disabled={loading} className="w-full h-14 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-2xl font-black text-lg uppercase italic">
                      <Wand2 className="mr-2" /> Re-Architect
                    </Button>
                    <p className="text-center text-[10px] font-black uppercase tracking-widest opacity-60">Path sync complete. Review steps on the desk.</p>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-10 border-t border-white/10 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest">Global Standard</h4>
                    <p className="text-[9px] font-bold opacity-60">Based on official Primary & Secondary schemes</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
