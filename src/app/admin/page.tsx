
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Sparkles, CheckCircle, Loader2, Wand2, BookOpen, ClipboardList, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, doc, addDoc, updateDoc, arrayUnion, increment, query, orderBy, serverTimestamp, deleteDoc } from "firebase/firestore";
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
    toast({ title: "Summoning AI...", description: `Professor Sky is researching your idea: "${idea || 'everything'}"` });
    try {
      const result = await generateBulkContent({ type, count: type === 'lessons' ? 10 : 15, idea });
      const items = type === 'lessons' ? result.lessons : result.tasks;
      
      if (items) {
        for (const item of items) {
          addDoc(collection(db, type), {
            ...item,
            createdAt: serverTimestamp()
          }).catch(() => {});
        }
        toast({ title: "Education Magic Done!", description: `${items.length} ${type} have been added!` });
        setIdea("");
      }
    } catch (e) {
      toast({ title: "AI Error", description: "Check your Gemini key or usage limits.", variant: "destructive" });
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
          toast({ title: "Badge Awarded!", description: `${submission.userName} earned the ${badgeName} badge!` });
        } else {
          updateDoc(doc(db, 'users', submission.userId), { 
            totalStars: increment(submission.points || 0) 
          }).catch(() => {});
          toast({ title: "Stars Awarded!", description: `${submission.userName} received ${submission.points} stars!` });
        }
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `submissions/${submission.id}`, operation: 'update' }));
      });
  };

  if (!mounted || isUserLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!user || !isAdmin) return null;

  return (
    <main className="min-h-screen bg-slate-50 p-6 max-w-4xl mx-auto pb-24">
      <header className="flex flex-col gap-6 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/"><Button variant="outline" size="icon" className="rounded-full"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold">Academy Mission Control <Sparkles className="text-primary inline-block" /></h1>
            <p className="text-sm text-muted-foreground">Tochi & Kelechi's Admin Panel</p>
          </div>
        </div>

        <Card className="border-none kid-card-shadow bg-white p-6">
          <div className="space-y-4">
            <Label htmlFor="idea" className="font-bold text-primary">What should the AI build today? (Your Ideas)</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input 
                id="idea"
                placeholder="e.g. History of Seoul, How to save money, Space travel..." 
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                className="rounded-xl h-12 flex-1"
              />
              <div className="flex gap-2">
                <Button onClick={() => handleAutoGenerate('lessons')} disabled={loading} className="bg-primary gap-2 rounded-xl h-12 px-6">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} Create Lessons
                </Button>
                <Button onClick={() => handleAutoGenerate('tasks')} disabled={loading} variant="outline" className="gap-2 rounded-xl h-12 px-6">
                   Create Missions
                </Button>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground italic">Note: Lessons give Badges. Missions give Stars.</p>
          </div>
        </Card>
      </header>

      <Tabs defaultValue="marking">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-white p-1 rounded-2xl kid-card-shadow h-12">
          <TabsTrigger value="marking" className="rounded-xl font-bold">Marking Queue ({submissions?.filter(s => s.status === 'pending').length || 0})</TabsTrigger>
          <TabsTrigger value="content" className="rounded-xl font-bold">View Curriculum</TabsTrigger>
        </TabsList>

        <TabsContent value="marking" className="space-y-4">
          {submissions?.filter(s => s.status === 'pending').map((sub) => (
            <Card key={sub.id} className="border-none kid-card-shadow bg-white overflow-hidden">
              <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-primary">{sub.userName}</h3>
                  <p className="text-sm font-medium">{sub.taskTitle}</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-secondary/10 text-secondary uppercase">
                    Reward: {sub.taskTitle.startsWith('Completed Lesson') ? 'Academic Badge' : `${sub.points} Stars`}
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
              <p className="text-xl font-bold">Everything Marked!</p>
              <p className="text-sm">You've helped all your students today.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="content">
          <div className="grid grid-cols-1 gap-4">
            <p className="text-sm font-bold text-muted-foreground px-2">Recently Added Content:</p>
            {/* Simple list of content for deletion if needed */}
            <div className="space-y-2">
              <Card className="p-4 flex items-center justify-between bg-white border-none kid-card-shadow">
                <div className="flex items-center gap-3">
                  <BookOpen className="text-primary w-5 h-5" />
                  <span className="font-bold">Total Curriculum Items</span>
                </div>
                <span className="font-black text-primary">Manage via AI Builder Above</span>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
