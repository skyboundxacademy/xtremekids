'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Sparkles, CheckCircle, Loader2, Wand2, BookOpen, ClipboardList } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, doc, addDoc, updateDoc, arrayUnion, increment, query, orderBy, serverTimestamp } from "firebase/firestore";
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
  const [idea, setIdea] = useState("");

  const userProfileRef = useMemoFirebase(() => {
    return user ? doc(db, 'users', user.uid) : null;
  }, [db, user]);
  const { data: profile } = useDoc<any>(userProfileRef);

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
    toast({ title: "Summoning Guru AI...", description: `Building 5 ${type} for "${idea || 'everything'}"` });
    try {
      const result = await generateBulkContent({ type, count: 5, idea });
      const items = type === 'lessons' ? result.lessons : result.tasks;
      
      if (items) {
        for (const item of items) {
          addDoc(collection(db, type), {
            ...item,
            createdAt: serverTimestamp()
          }).catch(() => {});
        }
        toast({ title: "Academy Updated!", description: `${items.length} academic ${type} generated!` });
        setIdea("");
      }
    } catch (e) {
      toast({ title: "AI Busy", description: "Gemini is busy, try again in a moment!", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (submission: any) => {
    const isLesson = submission.taskTitle.startsWith('Completed Lesson:');
    const badgeName = isLesson ? submission.taskTitle.replace('Completed Lesson: ', '') : null;

    updateDoc(doc(db, 'submissions', submission.id), { status: 'approved' })
      .then(() => {
        if (isLesson && badgeName) {
          updateDoc(doc(db, 'users', submission.userId), { 
            badges: arrayUnion(badgeName)
          }).catch(() => {});
          toast({ title: "Academic Badge Awarded!" });
        } else {
          updateDoc(doc(db, 'users', submission.userId), { 
            totalStars: increment(submission.points || 0) 
          }).catch(() => {});
          toast({ title: "Stars Awarded!" });
        }
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `submissions/${submission.id}`, operation: 'update' }));
      });
  };

  const handleReject = (submission: any) => {
    updateDoc(doc(db, 'submissions', submission.id), { status: 'rejected' })
      .then(() => toast({ title: "Submission Rejected" }))
      .catch(() => {});
  };

  if (!mounted || isUserLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!user || !isAdmin) return null;

  return (
    <main className="min-h-screen bg-slate-50 p-6 max-w-4xl mx-auto pb-24">
      <header className="flex flex-col gap-6 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/"><Button variant="outline" size="icon" className="rounded-full"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold">Academy Control <Sparkles className="text-primary inline-block" /></h1>
            <p className="text-sm text-muted-foreground">Admin: Tochi Okereke</p>
          </div>
        </div>

        <Card className="border-none kid-card-shadow bg-white p-6">
          <div className="space-y-4">
            <Label htmlFor="idea" className="font-bold text-primary">Guide the Guru AI</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input 
                id="idea"
                placeholder="Topic: Space, Robotics, Cooking, Math..." 
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                className="rounded-xl h-12 flex-1"
              />
              <div className="flex gap-2">
                <Button onClick={() => handleAutoGenerate('lessons')} disabled={loading} className="bg-primary gap-2 rounded-xl h-12 px-6">
                  {loading ? <Loader2 className="animate-spin" /> : <BookOpen className="w-4 h-4" />} Create Lessons (5)
                </Button>
                <Button onClick={() => handleAutoGenerate('tasks')} disabled={loading} variant="outline" className="gap-2 rounded-xl h-12 px-6">
                  {loading ? <Loader2 className="animate-spin" /> : <ClipboardList className="w-4 h-4" />} Create Missions (5)
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </header>

      <Tabs defaultValue="marking">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-white p-1 rounded-2xl kid-card-shadow h-12">
          <TabsTrigger value="marking" className="rounded-xl font-bold">Marking Queue ({submissions?.filter(s => s.status === 'pending').length || 0})</TabsTrigger>
          <TabsTrigger value="content" className="rounded-xl font-bold">Curriculum</TabsTrigger>
        </TabsList>

        <TabsContent value="marking" className="space-y-4">
          {submissions?.filter(s => s.status === 'pending').map((sub) => (
            <Card key={sub.id} className="border-none kid-card-shadow bg-white">
              <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-primary">{sub.userName}</h3>
                  <p className="text-sm font-medium">{sub.taskTitle}</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button className="flex-1 bg-green-500 font-bold" onClick={() => handleApprove(sub)}>Approve</Button>
                  <Button variant="outline" className="flex-1 text-red-500" onClick={() => handleReject(sub)}>Reject</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {submissions?.filter(s => s.status === 'pending').length === 0 && (
            <div className="text-center py-24 opacity-30">
              <CheckCircle className="w-16 h-16 mx-auto mb-4" />
              <p className="text-xl font-bold">All Marked!</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="content" className="text-center py-10 opacity-50 italic">
          Curriculum is managed via the Guru AI buttons above.
        </TabsContent>
      </Tabs>
    </main>
  );
}
