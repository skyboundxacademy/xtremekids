
'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Sparkles, CheckCircle, XCircle, LayoutDashboard, BookOpen, ClipboardList, Lightbulb, Trash2, Loader2, Wand2, Plus } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, doc, addDoc, updateDoc, increment, query, orderBy, serverTimestamp, deleteDoc } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { generateBulkContent } from "@/ai/flows/content-generator";

export default function AdminPage() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const userProfileRef = useMemoFirebase(() => {
    return user ? doc(db, 'users', user.uid) : null;
  }, [db, user]);
  const { data: profile } = useDoc<any>(userProfileRef);

  const isOwner = user?.email === 'goddikrayz@gmail.com';
  const isAdmin = isOwner || profile?.role === 'admin';

  useEffect(() => {
    setMounted(true);
    if (mounted && !isUserLoading && !user) router.push('/login');
    if (mounted && !isUserLoading && user && profile && !isAdmin) {
      toast({ title: "Access Denied", description: "You are not an admin!", variant: "destructive" });
      router.push('/');
    }
  }, [user, isUserLoading, router, mounted, profile, isAdmin]);

  const submissionsQuery = useMemoFirebase(() => {
    if (!user || !isAdmin) return null;
    return query(collection(db, 'submissions'), orderBy('timestamp', 'desc'));
  }, [db, user, isAdmin]);
  const { data: submissions } = useCollection<any>(submissionsQuery);

  const handleAutoGenerate = async (type: 'lessons' | 'tasks') => {
    setLoading(true);
    toast({ title: "Summoning AI...", description: `Professor Sky is writing ${type} for you!` });
    try {
      const count = type === 'lessons' ? 15 : 20;
      const result = await generateBulkContent({ type, count });
      const items = type === 'lessons' ? result.lessons : result.tasks;
      
      if (items) {
        for (const item of items) {
          addDoc(collection(db, type), {
            ...item,
            createdAt: serverTimestamp()
          }).catch(() => {});
        }
        toast({ title: "AI Magic Done!", description: `${items.length} ${type} have been added to your folders!` });
      }
    } catch (e) {
      toast({ title: "AI Error", description: "Gemini is tired, try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (submission: any) => {
    updateDoc(doc(db, 'submissions', submission.id), { status: 'approved' })
      .then(() => {
        updateDoc(doc(db, 'users', submission.userId), { 
          totalStars: increment(submission.points || 0) 
        }).catch(() => {});
        toast({ title: "Approved!", description: `${submission.userName} received stars!` });
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `submissions/${submission.id}`, operation: 'update' }));
      });
  };

  if (!mounted || isUserLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!user || !isAdmin) return null;

  return (
    <main className="min-h-screen bg-slate-50 p-6 max-w-4xl mx-auto pb-24">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link href="/"><Button variant="outline" size="icon" className="rounded-full"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">Admin Panel <Sparkles className="text-primary" /></h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleAutoGenerate('lessons')} disabled={loading} variant="outline" className="gap-2 bg-primary/10 border-primary/20 text-primary rounded-xl">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} AI Lessons
          </Button>
          <Button onClick={() => handleAutoGenerate('tasks')} disabled={loading} variant="outline" className="gap-2 bg-secondary/10 border-secondary/20 text-secondary rounded-xl">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} AI Tasks
          </Button>
        </div>
      </header>

      <Tabs defaultValue="marking">
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-white p-1 rounded-2xl kid-card-shadow">
          <TabsTrigger value="marking" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white">Marking</TabsTrigger>
          <TabsTrigger value="lessons" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white">Content</TabsTrigger>
          <TabsTrigger value="import" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white">Import Students</TabsTrigger>
        </TabsList>

        <TabsContent value="marking" className="space-y-4">
          <h2 className="text-lg font-bold mb-4">Pending Submissions</h2>
          {submissions?.filter(s => s.status === 'pending').map((sub) => (
            <Card key={sub.id} className="border-none kid-card-shadow overflow-hidden bg-white">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-primary">{sub.userName}</h3>
                  <p className="text-sm text-muted-foreground">{sub.taskTitle}</p>
                  <span className="text-xs font-bold text-secondary">{sub.points} Stars</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 rounded-xl" onClick={() => handleApprove(sub)}>Approve</Button>
                  <Button size="sm" variant="outline" className="text-red-500 border-red-100 hover:bg-red-50 rounded-xl" onClick={() => updateDoc(doc(db, 'submissions', sub.id), { status: 'rejected' })}>Reject</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {submissions?.filter(s => s.status === 'pending').length === 0 && (
            <div className="text-center py-20 opacity-30">
              <CheckCircle className="w-16 h-16 mx-auto mb-4" />
              <p className="font-bold">No pending work! You're all caught up.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="lessons">
           <Card className="border-none kid-card-shadow bg-white p-8 rounded-[2rem]">
             <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><BookOpen className="text-primary" /> Create Manual Content</h3>
             <p className="text-sm text-muted-foreground mb-8">Use the AI buttons at the top for faster content creation!</p>
             <div className="space-y-4 opacity-50 pointer-events-none">
               <Input placeholder="Lesson Title" />
               <Textarea placeholder="Lesson Content" />
               <Button className="w-full bg-primary font-bold">Add to Academy</Button>
             </div>
           </Card>
        </TabsContent>

        <TabsContent value="import">
          <Card className="border-none kid-card-shadow bg-white p-8 rounded-[2rem] text-center">
            <ClipboardList className="w-16 h-16 mx-auto text-primary/20 mb-4" />
            <h3 className="text-xl font-bold mb-2">Student Migration</h3>
            <p className="text-sm text-muted-foreground mb-6">Import your students from CSV or Excel files. This feature is coming in the next update!</p>
            <Button variant="outline" className="rounded-xl" onClick={() => toast({ title: "Coming Soon", description: "This will handle your batch student registration!" })}>
              Upload CSV File
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
