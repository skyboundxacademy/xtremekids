
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Sparkles, CheckCircle, Loader2, Wand2, BookOpen, ClipboardList, Plus, Trash2 } from "lucide-react";
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
  const [manualLesson, setManualLesson] = useState({
    title: "",
    category: "",
    ageRange: "",
    imageUrl: "",
    steps: [""]
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
          // Lessons from AI now need to be split into steps for the new interactive UI
          const finalItem = type === 'lessons' ? { 
            ...item, 
            steps: [item.content.substring(0, 500), item.content.substring(500, 1000), item.content.substring(1000)],
            createdAt: serverTimestamp() 
          } : { ...item, createdAt: serverTimestamp() };
          
          await addDoc(collection(db, type), finalItem);
        }
        toast({ title: "Academy Updated!", description: `${items.length} ${type} generated!` });
      }
    } catch (e) {
      toast({ title: "AI Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleManualAdd = async () => {
    if (!manualLesson.title || !manualLesson.category) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "lessons"), {
        ...manualLesson,
        createdAt: serverTimestamp()
      });
      toast({ title: "Lesson Published!" });
      setManualLesson({ title: "", category: "", ageRange: "", imageUrl: "", steps: [""] });
    } catch (e) {
      toast({ title: "Failed to publish", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const addStep = () => setManualLesson(prev => ({ ...prev, steps: [...prev.steps, ""] }));
  const updateStep = (idx: number, val: string) => {
    const newSteps = [...manualLesson.steps];
    newSteps[idx] = val;
    setManualLesson(prev => ({ ...prev, steps: newSteps }));
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
        <h1 className="text-2xl font-black text-primary uppercase tracking-tighter">Admin Academy Control</h1>
      </header>

      <Tabs defaultValue="manual">
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-white p-1 rounded-2xl kid-card-shadow h-14">
          <TabsTrigger value="manual" className="rounded-xl font-bold">Manual Add</TabsTrigger>
          <TabsTrigger value="ai" className="rounded-xl font-bold">Guru AI</TabsTrigger>
          <TabsTrigger value="marking" className="rounded-xl font-bold">Marking</TabsTrigger>
        </TabsList>

        <TabsContent value="manual">
          <Card className="border-none kid-card-shadow bg-white p-8 rounded-3xl space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold">Lesson Title</Label>
                <Input placeholder="E.g. Space Robots" value={manualLesson.title} onChange={e => setManualLesson(p => ({...p, title: e.target.value}))} />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Category</Label>
                <Input placeholder="E.g. Tech" value={manualLesson.category} onChange={e => setManualLesson(p => ({...p, category: e.target.value}))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold">Age Range</Label>
                <Input placeholder="E.g. 8-12" value={manualLesson.ageRange} onChange={e => setManualLesson(p => ({...p, ageRange: e.target.value}))} />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Image URL (or Unsplash Keywords)</Label>
                <Input placeholder="E.g. robots" value={manualLesson.imageUrl} onChange={e => setManualLesson(p => ({...p, imageUrl: e.target.value}))} />
              </div>
            </div>
            
            <div className="space-y-4">
              <Label className="font-bold flex items-center justify-between">
                Knowledge Steps (Content chunks)
                <Button onClick={addStep} size="sm" variant="outline" className="h-8 rounded-xl"><Plus className="w-4 h-4 mr-1"/> Add Step</Button>
              </Label>
              {manualLesson.steps.map((step, i) => (
                <Textarea 
                  key={i} 
                  placeholder={`Content Step ${i+1}`} 
                  value={step} 
                  onChange={e => updateStep(i, e.target.value)}
                  className="rounded-xl min-h-32"
                />
              ))}
            </div>

            <Button onClick={handleManualAdd} disabled={loading} className="w-full bg-primary h-14 rounded-2xl font-bold text-lg">
              {loading ? <Loader2 className="animate-spin" /> : "Publish Lesson Now"}
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card className="border-none kid-card-shadow bg-white p-8 rounded-3xl text-center">
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-bold text-primary mb-2">Guru AI Content Engine</h3>
            <p className="text-sm text-muted-foreground mb-8">Guide the AI to build your curriculum for you!</p>
            <Input 
              placeholder="Enter a topic (e.g. History of Rome)..." 
              className="h-14 rounded-2xl mb-6 text-center" 
              value={idea}
              onChange={e => setIdea(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={() => handleAutoGenerate('lessons')} disabled={loading} className="h-14 bg-primary rounded-2xl font-bold">AI Lessons (5)</Button>
              <Button onClick={() => handleAutoGenerate('tasks')} disabled={loading} variant="outline" className="h-14 rounded-2xl font-bold">AI Tasks (5)</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="marking" className="space-y-4">
          {submissions?.filter(s => s.status === 'pending').map((sub) => (
            <Card key={sub.id} className="border-none kid-card-shadow bg-white rounded-3xl p-6 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-primary">{sub.userName}</h4>
                <p className="text-xs font-medium">{sub.taskTitle}</p>
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
