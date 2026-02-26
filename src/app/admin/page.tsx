
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Sparkles, Loader2, Plus, Trash2, ClipboardList, BookOpen } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, doc, addDoc, updateDoc, arrayUnion, increment, query, orderBy, serverTimestamp, deleteDoc } from "firebase/firestore";
import { generateBulkContent } from "@/ai/flows/content-generator";

export default function AdminPage() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [idea, setIdea] = useState("");
  const [manualType, setManualType] = useState<'lesson' | 'task'>('lesson');
  
  const [manualLesson, setManualLesson] = useState({
    title: "",
    category: "",
    ageRange: "",
    imageUrl: "",
    steps: [""]
  });

  const [manualTask, setManualTask] = useState({
    title: "",
    points: 50,
    type: 'daily'
  });

  const userProfileRef = useMemoFirebase(() => {
    return user ? doc(db, 'users', user.uid) : null;
  }, [db, user]);
  const { data: profile } = useDoc<any>(userProfileRef);

  const isAdmin = user?.email === 'goddikrayz@gmail.com' || profile?.role === 'admin';

  useEffect(() => {
    if (!isUserLoading && !user) router.push('/login');
    if (!isUserLoading && user && profile && !isAdmin) router.push('/');
  }, [user, isUserLoading, router, profile, isAdmin]);

  const submissionsQuery = useMemoFirebase(() => {
    if (!user || !isAdmin) return null;
    return query(collection(db, 'submissions'), orderBy('timestamp', 'desc'));
  }, [db, user, isAdmin]);
  const { data: submissions } = useCollection<any>(submissionsQuery);

  const handleAutoGenerate = async (type: 'lessons' | 'tasks') => {
    setLoading(true);
    toast({ title: "Guru AI Waking Up...", description: `Creating ${type} for "${idea || 'General Knowledge'}"` });
    try {
      const result = await generateBulkContent({ type, count: 5, idea });
      const items = type === 'lessons' ? result.lessons : result.tasks;
      if (items) {
        for (const item of items) {
          const finalItem = type === 'lessons' ? { 
            ...item, 
            steps: [item.content.substring(0, 500), item.content.substring(500, 1000), item.content.substring(1000)],
            createdAt: serverTimestamp() 
          } : { ...item, createdAt: serverTimestamp() };
          await addDoc(collection(db, type), finalItem);
        }
        toast({ title: "Academy Updated!" });
      }
    } catch (e) {
      toast({ title: "AI Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleManualAddLesson = async () => {
    if (!manualLesson.title || !manualLesson.category) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "lessons"), { ...manualLesson, createdAt: serverTimestamp() });
      toast({ title: "Lesson Published!" });
      setManualLesson({ title: "", category: "", ageRange: "", imageUrl: "", steps: [""] });
    } finally { setLoading(false); }
  };

  const handleManualAddTask = async () => {
    if (!manualTask.title) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "tasks"), { ...manualTask, createdAt: serverTimestamp() });
      toast({ title: "Task Published!" });
      setManualTask({ title: "", points: 50, type: 'daily' });
    } finally { setLoading(false); }
  };

  const handleApprove = (submission: any) => {
    updateDoc(doc(db, 'submissions', submission.id), { status: 'approved' })
      .then(() => {
        if (submission.taskTitle.startsWith('Completed Lesson:')) {
          const badge = submission.taskTitle.replace('Completed Lesson: ', '');
          updateDoc(doc(db, 'users', submission.userId), { badges: arrayUnion(badge) });
        } else {
          updateDoc(doc(db, 'users', submission.userId), { totalStars: increment(submission.points || 0) });
        }
        toast({ title: "Approved!" });
      });
  };

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <main className="min-h-screen bg-slate-50 p-6 max-w-4xl mx-auto pb-24">
      <header className="flex items-center gap-4 mb-8">
        <Link href="/profile"><Button variant="outline" size="icon" className="rounded-full"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <h1 className="text-2xl font-black text-primary uppercase italic tracking-tighter">Command Center</h1>
      </header>

      <Tabs defaultValue="manual">
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-white p-1 rounded-2xl kid-card-shadow h-14">
          <TabsTrigger value="manual" className="rounded-xl font-bold">Manual</TabsTrigger>
          <TabsTrigger value="ai" className="rounded-xl font-bold">Guru AI</TabsTrigger>
          <TabsTrigger value="marking" className="rounded-xl font-bold">Inbox</TabsTrigger>
        </TabsList>

        <TabsContent value="manual">
          <div className="flex gap-2 mb-6">
             <Button variant={manualType === 'lesson' ? 'default' : 'outline'} onClick={() => setManualType('lesson')} className="rounded-xl font-bold flex-1 h-12">
                <BookOpen className="w-4 h-4 mr-2" /> Lesson
             </Button>
             <Button variant={manualType === 'task' ? 'default' : 'outline'} onClick={() => setManualType('task')} className="rounded-xl font-bold flex-1 h-12">
                <ClipboardList className="w-4 h-4 mr-2" /> Task
             </Button>
          </div>

          {manualType === 'lesson' ? (
            <Card className="border-none kid-card-shadow bg-white p-8 rounded-3xl space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold">Title</Label>
                  <Input value={manualLesson.title} onChange={e => setManualLesson(p => ({...p, title: e.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Category</Label>
                  <Input value={manualLesson.category} onChange={e => setManualLesson(p => ({...p, category: e.target.value}))} />
                </div>
              </div>
              <div className="space-y-4">
                {manualLesson.steps.map((step, i) => (
                  <Textarea key={i} placeholder={`Page ${i+1}`} value={step} onChange={e => {
                    const s = [...manualLesson.steps]; s[i] = e.target.value; setManualLesson(p => ({...p, steps: s}));
                  }} className="rounded-xl min-h-32"/>
                ))}
                <Button onClick={() => setManualLesson(p => ({...p, steps: [...p.steps, ""]}))} variant="outline" className="w-full rounded-xl">+ Add Page</Button>
              </div>
              <Button onClick={handleManualAddLesson} disabled={loading} className="w-full bg-primary h-14 rounded-2xl font-bold text-lg">Publish Lesson</Button>
            </Card>
          ) : (
            <Card className="border-none kid-card-shadow bg-white p-8 rounded-3xl space-y-6">
               <div className="space-y-2">
                  <Label className="font-bold">Task Description</Label>
                  <Input value={manualTask.title} onChange={e => setManualTask(p => ({...p, title: e.target.value}))} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <Label className="font-bold">Points</Label>
                     <Input type="number" value={manualTask.points} onChange={e => setManualTask(p => ({...p, points: parseInt(e.target.value)}))} />
                  </div>
                  <div className="space-y-2">
                     <Label className="font-bold">Type</Label>
                     <select className="w-full h-10 border rounded-xl px-3 font-bold text-sm" value={manualTask.type} onChange={e => setManualTask(p => ({...p, type: e.target.value as any}))}>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                     </select>
                  </div>
               </div>
               <Button onClick={handleManualAddTask} disabled={loading} className="w-full bg-secondary h-14 rounded-2xl font-bold text-lg">Publish Task</Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ai">
          <Card className="border-none kid-card-shadow bg-white p-8 rounded-3xl text-center">
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-4 animate-float" />
            <Input placeholder="Enter a topic (e.g. Space Robots)..." className="h-14 rounded-2xl mb-6 text-center italic font-bold" value={idea} onChange={e => setIdea(e.target.value)}/>
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={() => handleAutoGenerate('lessons')} disabled={loading} className="h-14 bg-primary rounded-2xl font-bold">AI Lessons</Button>
              <Button onClick={() => handleAutoGenerate('tasks')} disabled={loading} variant="outline" className="h-14 rounded-2xl font-bold">AI Tasks</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="marking" className="space-y-4">
          {submissions?.filter(s => s.status === 'pending').map((sub) => (
            <Card key={sub.id} className="border-none kid-card-shadow bg-white rounded-3xl p-6 flex items-center justify-between">
              <div>
                <h4 className="font-black text-primary italic">{sub.userName}</h4>
                <p className="text-xs font-bold text-slate-400">{sub.taskTitle}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleApprove(sub)} className="bg-green-500 rounded-xl h-10 font-bold">Approve</Button>
                <Button variant="outline" className="text-red-500 rounded-xl h-10 border-red-100" onClick={() => deleteDoc(doc(db, "submissions", sub.id))}>Reject</Button>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </main>
  );
}
