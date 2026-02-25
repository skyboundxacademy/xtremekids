
'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Save, Trash2, LayoutDashboard, CheckCircle, XCircle, Users, Upload } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, addDoc, updateDoc, increment, query, orderBy, serverTimestamp } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function AdminPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const [loading, setLoading] = useState(false);

  // Real-time submissions query memoized correctly
  const submissionsQuery = useMemoFirebase(() => {
    return query(collection(db, 'submissions'), orderBy('timestamp', 'desc'));
  }, [db]);
  
  const { data: submissions } = useCollection<any>(submissionsQuery);

  // Lesson State
  const [newLesson, setNewLesson] = useState({
    title: '',
    category: 'Space',
    description: '',
    content: '',
    imageUrl: 'https://picsum.photos/seed/new/600/400'
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
        setNewLesson({ title: '', category: 'Space', description: '', content: '', imageUrl: 'https://picsum.photos/seed/new/600/400' });
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'lessons', operation: 'create', requestResourceData: newLesson }));
      })
      .finally(() => setLoading(false));
  };

  const handleApprove = (submission: any) => {
    // 1. Approve submission
    updateDoc(doc(db, 'submissions', submission.id), { status: 'approved' })
      .catch(async () => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `submissions/${submission.id}`, operation: 'update' })));

    // 2. Award stars to user
    updateDoc(doc(db, 'users', submission.userId), { 
      totalStars: increment(submission.points || 0) 
    }).then(() => {
      toast({ title: "Approved!", description: `Explorer ${submission.userName} received ${submission.points} stars!` });
    }).catch(async () => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `users/${submission.userId}`, operation: 'update' })));
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
        <TabsList className="grid w-full grid-cols-4 rounded-2xl p-1 bg-white shadow-sm mb-8 h-12">
          <TabsTrigger value="marking" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white">Marking</TabsTrigger>
          <TabsTrigger value="lessons" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white">Lessons</TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white">Tasks</TabsTrigger>
          <TabsTrigger value="data" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white">Import</TabsTrigger>
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
          <Card className="rounded-3xl border-none shadow-md overflow-hidden bg-white">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="text-lg">Add New Lesson</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold">Title</label>
                  <Input 
                    value={newLesson.title}
                    onChange={(e) => setNewLesson({...newLesson, title: e.target.value})}
                    placeholder="Enter title..." 
                    className="rounded-xl" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Category</label>
                  <Input 
                    value={newLesson.category}
                    onChange={(e) => setNewLesson({...newLesson, category: e.target.value})}
                    placeholder="Space, Nature, Art, Science" 
                    className="rounded-xl" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Description</label>
                <Input 
                  value={newLesson.description}
                  onChange={(e) => setNewLesson({...newLesson, description: e.target.value})}
                  placeholder="Short catchy summary..." 
                  className="rounded-xl" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Image URL</label>
                <Input 
                  value={newLesson.imageUrl}
                  onChange={(e) => setNewLesson({...newLesson, imageUrl: e.target.value})}
                  placeholder="https://..." 
                  className="rounded-xl" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Content</label>
                <Textarea 
                  value={newLesson.content}
                  onChange={(e) => setNewLesson({...newLesson, content: e.target.value})}
                  placeholder="The actual lesson body text..." 
                  className="rounded-xl min-h-[200px]" 
                />
              </div>
              <Button onClick={handleAddLesson} disabled={loading} className="w-full rounded-xl bg-primary h-12 text-lg font-bold">
                <Plus className="w-5 h-5 mr-2" /> {loading ? "Creating..." : "Launch Adventure"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border-2 border-dashed">
            <p className="text-muted-foreground font-medium">Task builder interface coming soon!</p>
          </div>
        </TabsContent>

        <TabsContent value="data">
          <Card className="rounded-3xl border-none shadow-md overflow-hidden bg-white">
            <CardHeader className="bg-secondary/5 border-b border-secondary/10">
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="text-secondary" /> Import Student Data
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10 text-center">
              <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-2">CSV Migration Tool</h3>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                Upload your existing student CSV to bring their star balance and profiles over to Skybound Academy.
              </p>
              <Button className="rounded-xl bg-secondary hover:bg-secondary/90 h-12 px-8 font-bold">
                Choose CSV File
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
