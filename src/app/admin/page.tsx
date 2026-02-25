
'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, CheckCircle, XCircle, Users, Upload, LayoutDashboard, Star, BookOpen, ClipboardList, Lightbulb, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc, addDoc, updateDoc, increment, query, orderBy, serverTimestamp, deleteDoc } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function AdminPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  const [loading, setLoading] = useState(false);

  // Real-time queries
  const submissionsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'submissions'), orderBy('timestamp', 'desc'));
  }, [db, user]);
  const { data: submissions } = useCollection<any>(submissionsQuery);

  const lessonsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'lessons'), orderBy('createdAt', 'desc'));
  }, [db, user]);
  const { data: lessons } = useCollection<any>(lessonsQuery);

  // Lesson State
  const [newLesson, setNewLesson] = useState({
    title: '',
    category: 'Space',
    description: '',
    content: '',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800'
  });

  // Task State
  const [newTask, setNewTask] = useState({
    title: '',
    points: 50,
    type: 'daily'
  });

  // Quiz State
  const [newQuiz, setNewQuiz] = useState({
    title: '',
    questions: [
      { question: '', options: ['', '', ''], correctAnswer: 0 }
    ]
  });

  const handleAddLesson = () => {
    if (!newLesson.title || !newLesson.content) {
      toast({ title: "Error", description: "Please fill out all fields!", variant: "destructive" });
      return;
    }
    setLoading(true);
    addDoc(collection(db, 'lessons'), {
      ...newLesson,
      createdAt: serverTimestamp()
    })
      .then(() => {
        toast({ title: "Success!", description: "New adventure added!" });
        setNewLesson({ title: '', category: 'Space', description: '', content: '', imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800' });
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'lessons', operation: 'create', requestResourceData: newLesson }));
      })
      .finally(() => setLoading(false));
  };

  const handleAddTask = () => {
    if (!newTask.title) return;
    setLoading(true);
    addDoc(collection(db, 'tasks'), {
      ...newTask,
      createdAt: serverTimestamp()
    })
      .then(() => {
        toast({ title: "Success!", description: "New mission added!" });
        setNewTask({ title: '', points: 50, type: 'daily' });
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'tasks', operation: 'create', requestResourceData: newTask }));
      })
      .finally(() => setLoading(false));
  };

  const handleAddQuiz = () => {
    if (!newQuiz.title || newQuiz.questions[0].question === '') {
      toast({ title: "Error", description: "Please add a title and at least one question!", variant: "destructive" });
      return;
    }
    setLoading(true);
    addDoc(collection(db, 'quizzes'), {
      ...newQuiz,
      createdAt: serverTimestamp()
    })
      .then(() => {
        toast({ title: "Success!", description: "Quiz created!" });
        setNewQuiz({ title: '', questions: [{ question: '', options: ['', '', ''], correctAnswer: 0 }] });
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'quizzes', operation: 'create', requestResourceData: newQuiz }));
      })
      .finally(() => setLoading(false));
  };

  const handleApprove = (submission: any) => {
    updateDoc(doc(db, 'submissions', submission.id), { status: 'approved' })
      .then(() => {
        return updateDoc(doc(db, 'users', submission.userId), { 
          totalStars: increment(submission.points || 0) 
        });
      })
      .then(() => {
        toast({ title: "Approved!", description: `Explorer ${submission.userName} received ${submission.points} stars!` });
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ 
          path: `submissions/${submission.id}`, 
          operation: 'update' 
        }));
      });
  };

  const handleReject = (submission: any) => {
    updateDoc(doc(db, 'submissions', submission.id), { status: 'rejected' })
      .then(() => {
        toast({ title: "Mission Rejected", description: "Submission marked as rejected." });
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ 
          path: `submissions/${submission.id}`, 
          operation: 'update' 
        }));
      });
  };

  const handleDeleteLesson = (id: string) => {
    deleteDoc(doc(db, 'lessons', id))
      .then(() => toast({ title: "Deleted", description: "Lesson removed." }))
      .catch(() => toast({ title: "Error", description: "Permission denied", variant: "destructive" }));
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 max-w-4xl mx-auto pb-24">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon" className="rounded-full shadow-sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="text-primary" /> Admin Panel
          </h1>
        </div>
      </header>

      <Tabs defaultValue="marking" className="w-full">
        <TabsList className="grid w-full grid-cols-5 rounded-2xl p-1 bg-white shadow-sm mb-8 h-12">
          <TabsTrigger value="marking" className="rounded-xl">Marking</TabsTrigger>
          <TabsTrigger value="lessons" className="rounded-xl">Lessons</TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-xl">Tasks</TabsTrigger>
          <TabsTrigger value="quizzes" className="rounded-xl">Quizzes</TabsTrigger>
          <TabsTrigger value="data" className="rounded-xl">Import</TabsTrigger>
        </TabsList>

        <TabsContent value="marking">
          <div className="space-y-4">
            <h2 className="text-xl font-bold px-2">Pending Missions</h2>
            {submissions?.filter(s => s.status === 'pending').map((sub) => (
              <Card key={sub.id} className="rounded-3xl border-none shadow-md overflow-hidden bg-white p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg text-primary">{sub.userName}</h3>
                    <p className="text-sm text-muted-foreground">Task: {sub.taskTitle}</p>
                    <span className="text-[10px] font-bold text-secondary uppercase bg-secondary/10 px-2 py-1 rounded-full mt-2 inline-block">
                      {sub.points} Stars pending
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="rounded-xl bg-green-500 hover:bg-green-600 gap-2"
                      onClick={() => handleApprove(sub)}
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleReject(sub)}
                      className="rounded-xl text-destructive border-destructive/20 hover:bg-destructive/5"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {submissions?.filter(s => s.status === 'pending').length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl shadow-sm border-2 border-dashed">
                <p className="text-muted-foreground font-medium">All missions marked! Great job Professor!</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="lessons">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-3xl border-none shadow-md overflow-hidden bg-white h-fit">
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" /> Add New Lesson
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <Input value={newLesson.title} onChange={(e) => setNewLesson({...newLesson, title: e.target.value})} placeholder="Title" />
                <Input value={newLesson.category} onChange={(e) => setNewLesson({...newLesson, category: e.target.value})} placeholder="Category (e.g. Space)" />
                <Input value={newLesson.description} onChange={(e) => setNewLesson({...newLesson, description: e.target.value})} placeholder="Short description" />
                <Input value={newLesson.imageUrl} onChange={(e) => setNewLesson({...newLesson, imageUrl: e.target.value})} placeholder="Unsplash Image URL" />
                <Textarea value={newLesson.content} onChange={(e) => setNewLesson({...newLesson, content: e.target.value})} placeholder="Lesson content..." className="min-h-[150px]" />
                <Button onClick={handleAddLesson} disabled={loading} className="w-full rounded-xl bg-primary">Create Lesson</Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="font-bold text-lg">Existing Lessons</h3>
              {lessons?.map(lesson => (
                <div key={lesson.id} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
                  <span className="font-medium">{lesson.title}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteLesson(lesson.id)} className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <Card className="rounded-3xl border-none shadow-md overflow-hidden bg-white max-w-lg mx-auto">
            <CardHeader className="bg-secondary/5 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-secondary" /> Add Mission
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Input value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} placeholder="Mission Title" />
              <Input type="number" value={newTask.points} onChange={(e) => setNewTask({...newTask, points: parseInt(e.target.value)})} placeholder="Stars" />
              <select value={newTask.type} onChange={(e) => setNewTask({...newTask, type: e.target.value as any})} className="w-full h-10 px-3 rounded-md border">
                <option value="daily">Daily Mission</option>
                <option value="weekly">Weekly Challenge</option>
              </select>
              <Button onClick={handleAddTask} disabled={loading} className="w-full rounded-xl bg-secondary">Add Mission</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quizzes">
          <Card className="rounded-3xl border-none shadow-md overflow-hidden bg-white max-w-lg mx-auto">
            <CardHeader className="bg-yellow-500/5 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" /> Create Quiz
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Input value={newQuiz.title} onChange={(e) => setNewQuiz({...newQuiz, title: e.target.value})} placeholder="Quiz Title" />
              {newQuiz.questions.map((q, idx) => (
                <div key={idx} className="p-4 border rounded-xl space-y-2">
                  <Input value={q.question} onChange={(e) => {
                    const qs = [...newQuiz.questions];
                    qs[idx].question = e.target.value;
                    setNewQuiz({...newQuiz, questions: qs});
                  }} placeholder={`Question ${idx + 1}`} />
                  {q.options.map((opt, oIdx) => (
                    <Input key={oIdx} value={opt} onChange={(e) => {
                      const qs = [...newQuiz.questions];
                      qs[idx].options[oIdx] = e.target.value;
                      setNewQuiz({...newQuiz, questions: qs});
                    }} placeholder={`Option ${oIdx + 1}`} />
                  ))}
                </div>
              ))}
              <Button onClick={handleAddQuiz} disabled={loading} className="w-full rounded-xl bg-yellow-500 hover:bg-yellow-600">Create Quiz</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card className="rounded-3xl border-none shadow-md overflow-hidden bg-white p-10 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Upload className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">CSV Migration Tool</h3>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
              Ready to import your students? Upload your CSV and we'll sync their balances to Firestore.
            </p>
            <Button variant="outline" className="rounded-xl h-12 px-8 font-bold border-2">
              Select CSV File
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
