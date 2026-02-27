
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, Sparkles, Loader2, Trash2, Plus, 
  BookOpen, CheckCircle2, LayoutGrid, Award, Send, X, Edit3, Image as ImageIcon, Save
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, addDoc, serverTimestamp, updateDoc, increment, query, where, orderBy, deleteDoc, writeBatch } from "firebase/firestore";
import { generateDeepLesson } from "@/ai/flows/content-generator";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AppLogo } from "@/components/AppLogo";

const SUBJECTS = [
  "Mathematics", "Further Mathematics", "English Language", "Literature-in-English", 
  "Physics", "Chemistry", "Biology", "Agricultural Science", "Economics", 
  "Geography", "Government", "Civic Education", "Financial Accounting", 
  "Commerce", "ICT / Data Processing", "Technical Drawing", "CRS / IRS", "Visual Arts",
  "Basic Science", "Basic Technology", "Social Studies", "Home Economics", "Physical and Health Education",
  "Korean Language", "French", "Igbo", "Yoruba", "Hausa", "Arabic"
];

const CLASSES = [
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
  "JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"
];

const GURU_AVATAR = "https://picsum.photos/seed/labubu-purple/400/400";

export default function AdminPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  
  const [activeView, setActiveView] = useState<"dashboard" | "approve-tasks" | "approve-lessons" | "create">("dashboard");
  const [loading, setLoading] = useState(false);
  const [guruInput, setGuruInput] = useState("");
  
  const [lessonForm, setLessonForm] = useState({
    title: "",
    subject: "",
    targetClass: "",
    idea: "",
    imageUrl: "",
    description: "",
    steps: [] as any[]
  });

  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);

  const submissionsQuery = useMemoFirebase(() => query(collection(db, "submissions"), where("status", "==", "pending")), [db]);
  const { data: pendingSubmissions } = useCollection<any>(submissionsQuery);

  const lessonsQuery = useMemoFirebase(() => query(collection(db, "lessons"), orderBy("createdAt", "desc")), [db]);
  const { data: allLessons } = useCollection<any>(lessonsQuery);

  const handleGuruMagic = async () => {
    if (!guruInput) {
      toast({ title: "Architect Sidekick", description: "Tell me what you want to build!" });
      return;
    }
    setLoading(true);
    try {
      const result = await generateDeepLesson({
        title: lessonForm.title || "Elite Academic Journey",
        subject: lessonForm.subject || "General Studies",
        targetClass: lessonForm.targetClass || "Academy",
        idea: guruInput
      });
      setLessonForm(prev => ({ 
        ...prev, 
        ...result,
        title: result.title || prev.title,
        subject: result.category || prev.subject,
      }));
      setGuruInput("");
      toast({ title: "Path Architected!", description: "Professor Sky has mapped out the journey." });
    } catch (e) {
      toast({ title: "Magic Failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!lessonForm.subject || !lessonForm.targetClass || lessonForm.steps.length === 0) {
      toast({ title: "Incomplete Path", description: "Subject, Class, and Content steps are required!" });
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "lessons"), {
        ...lessonForm,
        createdAt: serverTimestamp(),
        category: lessonForm.subject
      });
      toast({ title: "Academy Live!", description: "The path is now open for students." });
      setActiveView("dashboard");
      setLessonForm({ title: "", subject: "", targetClass: "", idea: "", imageUrl: "", description: "", steps: [] });
    } catch (e) {
      toast({ title: "Failed to publish", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateStepContent = (index: number, content: string) => {
    const newSteps = [...lessonForm.steps];
    newSteps[index].content = content;
    setLessonForm(p => ({ ...p, steps: newSteps }));
  };

  const approveSubmission = async (sub: any) => {
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "submissions", sub.id), { status: "approved" });
      batch.update(doc(db, "users", sub.userId), { totalStars: increment(sub.points || 10) });
      await batch.commit();
      toast({ title: "Mission Approved!", description: `${sub.userName} rewarded.` });
    } catch (e) {
      toast({ title: "Approval failed", variant: "destructive" });
    }
  };

  const deleteLesson = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await deleteDoc(doc(db, "lessons", id));
      toast({ title: "Path Removed" });
    } catch (e) {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  return (
    <main className="min-h-screen bg-slate-50/50 pb-20">
      <header className="bg-white border-b px-6 py-8 sticky top-0 z-[50]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {activeView !== "dashboard" ? (
              <Button variant="ghost" size="icon" onClick={() => setActiveView("dashboard")} className="rounded-full">
                <ArrowLeft className="w-6 h-6" />
              </Button>
            ) : (
              <AppLogo />
            )}
            <div>
              <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
                {activeView === "dashboard" ? "Command Center" : activeView === "create" ? "Path Architect" : activeView === "approve-tasks" ? "Approve Missions" : "Registry Management"}
              </h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Admin Secure Portal</p>
            </div>
          </div>
          <Link href="/profile">
            <Button variant="outline" className="rounded-2xl border-primary/20 font-bold h-12 bg-white kid-card-shadow">Exit Console</Button>
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        {activeView === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
            <Card className="border-none kid-card-shadow bg-primary text-white p-8 rounded-[2.5rem] cursor-pointer hover:scale-[1.02] transition-transform flex flex-col items-center text-center gap-4" onClick={() => setActiveView("approve-tasks")}>
              <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <Award className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">Approve Missions</h2>
            </Card>

            <Card className="border-none kid-card-shadow bg-white text-slate-800 p-8 rounded-[2.5rem] cursor-pointer hover:scale-[1.02] transition-transform flex flex-col items-center text-center gap-4" onClick={() => setActiveView("approve-lessons")}>
              <div className="w-20 h-20 rounded-3xl bg-secondary/10 flex items-center justify-center text-secondary">
                <LayoutGrid className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">Manage Registry</h2>
            </Card>

            <Card className="border-none kid-card-shadow bg-secondary text-white p-8 rounded-[2.5rem] cursor-pointer hover:scale-[1.02] transition-transform flex flex-col items-center text-center gap-4" onClick={() => setActiveView("create")}>
              <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <Plus className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">Architect Path</h2>
            </Card>
          </div>
        )}

        {activeView === "approve-tasks" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            {pendingSubmissions?.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[2.5rem] kid-card-shadow">
                <CheckCircle2 className="w-16 h-16 text-primary/10 mx-auto mb-4" />
                <p className="font-black text-slate-400 uppercase tracking-widest italic">All missions are currently evaluated.</p>
              </div>
            ) : (
              pendingSubmissions?.map((sub: any) => (
                <Card key={sub.id} className="border-none kid-card-shadow bg-white p-6 rounded-3xl flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-slate-800 text-lg leading-none">{sub.userName}</h4>
                    <p className="text-xs font-bold text-primary uppercase mt-1">{sub.taskTitle}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => approveSubmission(sub)} className="rounded-2xl bg-primary font-black uppercase tracking-tighter h-12 px-8">Approve</Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeView === "approve-lessons" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4">
            {allLessons?.map((lesson: any) => (
              <Card key={lesson.id} className="border-none kid-card-shadow bg-white overflow-hidden rounded-[2rem] group">
                <div className="relative h-40">
                  <Image src={lesson.imageUrl} alt="l" fill className="object-cover" unoptimized data-ai-hint="lesson preview" />
                  <div className="absolute inset-0 bg-black/20" />
                  <Badge className="absolute top-4 left-4 bg-primary text-white border-none">{lesson.category}</Badge>
                  <Badge className="absolute top-4 right-4 bg-secondary text-white border-none">{lesson.targetClass}</Badge>
                </div>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-slate-800 uppercase italic tracking-tighter leading-tight">{lesson.title}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase mt-1">{lesson.targetClass}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-rose-500 hover:bg-rose-50 rounded-full" onClick={() => deleteLesson(lesson.id)}>
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeView === "create" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-bottom-4">
            <div className="lg:col-span-7 space-y-8">
              <Card className="border-none kid-card-shadow bg-white p-8 rounded-[2.5rem] space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Path Title</Label>
                    <Input value={lessonForm.title} onChange={e => setLessonForm(p => ({...p, title: e.target.value}))} className="rounded-xl h-14 bg-slate-50 border-none font-bold italic" placeholder="e.g. Intro to Algebra" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Class Level</Label>
                    <Select onValueChange={v => setLessonForm(p => ({...p, targetClass: v}))} value={lessonForm.targetClass}>
                      <SelectTrigger className="rounded-xl h-14 bg-slate-50 border-none font-bold italic"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">Subject Category</Label>
                  <Select onValueChange={v => setLessonForm(p => ({...p, subject: v}))} value={lessonForm.subject}>
                    <SelectTrigger className="rounded-xl h-14 bg-slate-50 border-none font-bold italic"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-80">
                        {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>

                {lessonForm.steps.length > 0 && (
                  <div className="space-y-6 pt-6 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                       <h3 className="text-lg font-black text-primary uppercase italic">Architect's Desk (Review Content)</h3>
                       <Badge variant="outline" className="font-black">{lessonForm.steps.length} Steps</Badge>
                    </div>
                    
                    <div className="space-y-4">
                      {lessonForm.steps.map((step, i) => (
                        <Card key={i} className="border-none bg-slate-50 p-6 rounded-3xl relative">
                           <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs shrink-0">{i+1}</span>
                                <Badge className="uppercase font-black text-[9px] tracking-widest">{step.type}</Badge>
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => setEditingStepIndex(editingStepIndex === i ? null : i)} className="rounded-full">
                                {editingStepIndex === i ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                              </Button>
                           </div>

                           {editingStepIndex === i ? (
                             <Textarea 
                               value={step.content} 
                               onChange={(e) => updateStepContent(i, e.target.value)}
                               className="min-h-[100px] rounded-2xl bg-white border-none font-medium italic mb-4"
                             />
                           ) : (
                             <p className="text-sm font-medium text-slate-700 italic leading-relaxed whitespace-pre-wrap">{step.content}</p>
                           )}

                           {step.imageUrl && (
                             <div className="mt-4 flex items-center gap-2 text-primary opacity-50">
                                <ImageIcon className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest italic">Visual: {step.imageUrl.split('seed/')[1]?.split('/')[0] || 'Auto'}</span>
                             </div>
                           )}

                           {step.type === 'poll' && step.poll && (
                             <div className="mt-4 p-4 bg-white/50 rounded-2xl border-2 border-dashed border-primary/10">
                                <p className="text-xs font-black text-primary mb-2 uppercase italic tracking-widest">Poll Check</p>
                                <p className="text-xs font-bold mb-2">{step.poll.question}</p>
                                <div className="grid grid-cols-2 gap-2">
                                   {step.poll.options.map((opt: string) => (
                                     <div key={opt} className={cn("text-[9px] p-2 rounded-lg font-bold border", opt === step.poll.correctAnswer ? "bg-green-50 border-green-200 text-green-700" : "bg-slate-100 border-slate-200 text-slate-400")}>{opt}</div>
                                   ))}
                                </div>
                             </div>
                           )}
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                <Button onClick={handlePublish} disabled={loading || lessonForm.steps.length === 0} className="w-full h-16 rounded-[2rem] bg-primary font-black text-xl kid-card-shadow uppercase italic tracking-tighter">
                   {loading ? <Loader2 className="animate-spin" /> : "Publish to Academy"}
                </Button>
              </Card>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-6">
              <Card className="border-none kid-card-shadow bg-primary rounded-[3rem] p-8 text-white flex-1 relative overflow-hidden flex flex-col sticky top-32 h-fit">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center relative overflow-hidden border-2 border-white/30">
                      <Image src={GURU_AVATAR} alt="Guru" fill className="object-cover" unoptimized data-ai-hint="guru avatar" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Professor Sky</h2>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">AI Architect Sidekick</p>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-[2rem] p-6 mb-8 border border-white/10 min-h-[120px]">
                    <p className="text-sm font-bold leading-relaxed italic">
                      {loading ? "Architecting the academic journey..." : (lessonForm.steps.length > 0 ? "The Path is architected! Review every step on your desk. You can edit the text before hitting Publish." : "Tell me what you want to build! Example: 'Create a JSS 1 Math path about Algebra'. I will fill out the content for you.")}
                    </p>
                  </div>
                </div>

                <div className="mt-auto relative z-10">
                   <div className="relative">
                      <Input 
                        className="rounded-2xl h-16 bg-white/10 border-white/20 text-white placeholder:text-white/40 font-bold italic px-6 pr-16" 
                        placeholder="Message Professor Sky..." 
                        value={guruInput}
                        onChange={(e) => setGuruInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGuruMagic()}
                      />
                      <Button onClick={handleGuruMagic} disabled={loading} size="icon" className="absolute right-2 top-2 h-12 w-12 rounded-xl bg-white text-primary hover:bg-white/90">
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                      </Button>
                   </div>
                   <p className="text-[9px] text-center mt-4 opacity-40 font-bold uppercase tracking-widest">Click magic spark to auto-fill content</p>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
