
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/tabs";
import { ArrowLeft, Sparkles, CheckCircle, Loader2, Wand2, Plus, BookOpen, ClipboardList } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, doc, addDoc, updateDoc, increment, query, orderBy, serverTimestamp } from "firebase/firestore";
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

  // Tochi: You are the boss.
  const isAdmin = user?.email === 'goddikrayz@gmail.com' || profile?.role === 'admin';

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
    toast({ title: "Summoning AI...", description: `Professor Sky is writing ${type} using your Gemini key!` });
    try {
      const count = type === 'lessons' ? 15 : 20;
      const result = await generateBulkContent({ type, count });
      const items = type === 'lessons' ? result.lessons : result.tasks;
      
      if (items) {
        // Sequentially add to avoid hitting rate limits or causing rules issues during bulk
        for (const item of items) {
          addDoc(collection(db, type), {
            ...item,
            createdAt: serverTimestamp()
          }).catch(() => {});
        }
        toast({ title: "AI Magic Done!", description: `${items.length} ${type} have been added!` });
      }
    } catch (e) {
      toast({ title: "AI Error", description: "Check your Gemini key or try again.", variant: "destructive" });
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
          <h1 className="text-2xl font-bold">Admin Panel <Sparkles className="text-primary" /></h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleAutoGenerate('lessons')} disabled={loading} variant="outline" className="gap-2 rounded-xl">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} AI Lessons
          </Button>
          <Button onClick={() => handleAutoGenerate('tasks')} disabled={loading} variant="outline" className="gap-2 rounded-xl">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} AI Tasks
          </Button>
        </div>
      </header>

      <Tabs defaultValue="marking">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-white p-1 rounded-2xl kid-card-shadow">
          <TabsTrigger value="marking">Marking</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        <TabsContent value="marking" className="space-y-4">
          {submissions?.filter(s => s.status === 'pending').map((sub) => (
            <Card key={sub.id} className="border-none kid-card-shadow bg-white">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">{sub.userName}</h3>
                  <p className="text-sm text-muted-foreground">{sub.taskTitle}</p>
                  <span className="text-xs font-bold text-secondary">{sub.points} Stars</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl" onClick={() => handleApprove(sub)}>Approve</Button>
                  <Button size="sm" variant="outline" className="text-red-500 rounded-xl" onClick={() => updateDoc(doc(db, 'submissions', sub.id), { status: 'rejected' })}>Reject</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {submissions?.filter(s => s.status === 'pending').length === 0 && (
            <div className="text-center py-20 opacity-30">
              <CheckCircle className="w-16 h-16 mx-auto mb-4" />
              <p className="font-bold">All work is marked!</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="content">
          <div className="text-center py-20 border-2 border-dashed rounded-3xl">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-primary/20" />
            <p className="font-bold text-muted-foreground">Use AI buttons above to generate lessons & tasks instantly!</p>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
