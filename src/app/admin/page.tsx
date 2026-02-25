'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Sparkles, CheckCircle, Loader2, Wand2, Plus, BookOpen, ClipboardList, Send } from "lucide-react";
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

  // Tochi: You are the boss. Super Admin by email or role.
  const isAdmin = user?.email === 'goddikrayz@gmail.com' || profile?.role === 'admin';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isUserLoading && !user) {
      router.push('/login');
    }
    if (mounted && !isUserLoading && user && profile && !isAdmin) {
      toast({ title: "Access Denied", description: "You are not an admin!", variant: "destructive" });
      router.push('/');
    }
  }, [user, isUserLoading, router, mounted, profile, isAdmin, toast]);

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
        for (const item of items) {
          addDoc(collection(db, type), {
            ...item,
            createdAt: serverTimestamp()
          }).catch(() => {});
        }
        toast({ title: "AI Magic Done!", description: `${items.length} ${type} have been added to your academy!` });
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

  if (!mounted || isUserLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!user || !isAdmin) return null;

  return (
    <main className="min-h-screen bg-slate-50 p-6 max-w-4xl mx-auto pb-24">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/"><Button variant="outline" size="icon" className="rounded-full"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold">Admin Panel <Sparkles className="text-primary inline-block" /></h1>
            <p className="text-sm text-muted-foreground">Manage your explorers and academy content</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={() => handleAutoGenerate('lessons')} disabled={loading} variant="outline" className="flex-1 md:flex-none gap-2 rounded-xl">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} AI Lessons
          </Button>
          <Button onClick={() => handleAutoGenerate('tasks')} disabled={loading} variant="outline" className="flex-1 md:flex-none gap-2 rounded-xl">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} AI Tasks
          </Button>
        </div>
      </header>

      <Tabs defaultValue="marking">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-white p-1 rounded-2xl kid-card-shadow h-12">
          <TabsTrigger value="marking" className="rounded-xl font-bold">Marking Queue</TabsTrigger>
          <TabsTrigger value="content" className="rounded-xl font-bold">Academy Content</TabsTrigger>
        </TabsList>

        <TabsContent value="marking" className="space-y-4">
          {submissions?.filter(s => s.status === 'pending').map((sub) => (
            <Card key={sub.id} className="border-none kid-card-shadow bg-white overflow-hidden">
              <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-bold text-lg text-primary">{sub.userName}</h3>
                  <p className="text-sm text-muted-foreground mb-1">{sub.taskTitle}</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary/10 text-secondary">
                    {sub.points} Stars
                  </span>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    size="sm" 
                    className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl" 
                    onClick={() => handleApprove(sub)}
                  >
                    Approve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 sm:flex-none text-red-500 hover:bg-red-50 rounded-xl" 
                    onClick={() => updateDoc(doc(db, 'submissions', sub.id), { status: 'rejected' })}
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {submissions?.filter(s => s.status === 'pending').length === 0 && (
            <div className="text-center py-24 opacity-30">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <p className="text-xl font-bold">Hooray! No pending work.</p>
              <p className="text-sm">You've cleared the marking desk!</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-none kid-card-shadow bg-white p-6 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-bold mb-2">Lessons</h3>
              <p className="text-sm text-muted-foreground mb-4">Click "AI Lessons" above to auto-generate 15 new topics with images.</p>
            </Card>
            <Card className="border-none kid-card-shadow bg-white p-6 text-center">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 text-secondary" />
              <h3 className="font-bold mb-2">Tasks</h3>
              <p className="text-sm text-muted-foreground mb-4">Click "AI Tasks" above to create 20 new missions for explorers.</p>
            </Card>
          </div>
          <div className="mt-8 p-8 border-2 border-dashed border-primary/20 rounded-3xl text-center">
            <p className="text-primary font-bold">Tip for Tochi & Kelechi:</p>
            <p className="text-sm text-muted-foreground">The "AI Magic" buttons use your Gemini key to populate the folders automatically!</p>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
