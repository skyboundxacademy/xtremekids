
"use client"

import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Circle, Cloud, Sparkles, Star, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, where, getDocs } from "firebase/firestore";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Button } from "@/components/ui/button";

export default function TasksPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());

  const tasksQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
  }, [db, user]);

  const { data: tasks, isLoading } = useCollection<any>(tasksQuery);

  // Fetch user's approved submissions to mark tasks as "Done"
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "submissions"),
      where("userId", "==", user.uid),
      where("status", "==", "approved")
    );
    getDocs(q).then((snapshot) => {
      const completedTitles = new Set(snapshot.docs.map(doc => doc.data().taskTitle));
      setCompletedTaskIds(completedTitles);
    });
  }, [user, db, submittingId]);

  const handleTaskSubmit = (task: any) => {
    if (!user) return;
    setSubmittingId(task.id);

    const submissionData = {
      userId: user.uid,
      userName: user.displayName || "Explorer",
      taskTitle: task.title,
      points: task.points,
      status: "pending",
      timestamp: serverTimestamp()
    };

    addDoc(collection(db, "submissions"), submissionData)
      .then(() => {
        toast({ 
          title: "Mission Sent!", 
          description: `Professor Sky will mark "${task.title}" soon. Keep it up!` 
        });
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ 
          path: 'submissions', 
          operation: 'create', 
          requestResourceData: submissionData 
        }));
      })
      .finally(() => setSubmittingId(null));
  };

  const tasksList = tasks || [];
  const completedCount = tasksList.filter(t => completedTaskIds.has(t.title)).length;
  const progress = tasksList.length > 0 ? (completedCount / tasksList.length) * 100 : 0;

  return (
    <main className="min-h-screen pb-24 px-6 pt-12 max-w-md mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-2">
          Daily Tasks <Sparkles className="text-secondary" />
        </h1>
        <p className="text-muted-foreground font-medium mb-8">Complete tasks to earn stars!</p>

        <div className="bg-white p-6 rounded-3xl kid-card-shadow border-none relative overflow-hidden">
          <div className="diary-tape bg-primary/20" />
          <div className="flex justify-between items-end mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Daily Progress</span>
            <span className="text-xl font-black text-primary">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-4 rounded-full bg-primary/5 [&>div]:bg-primary" />
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-bold px-2 flex items-center gap-2">
          <Cloud className="w-5 h-5 text-primary/30" /> Today's Mission
        </h2>

        {(isLoading || !user) && (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        )}

        {!isLoading && user && tasksList.map((task) => {
          const isCompleted = completedTaskIds.has(task.title);
          return (
            <Card key={task.id} className={cn(
              "border-none kid-card-shadow transition-all group",
              isCompleted ? "bg-primary/5 opacity-80" : "bg-white"
            )}>
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors",
                    isCompleted ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:bg-primary/10"
                  )}>
                    {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className={cn("font-bold", isCompleted && "line-through text-muted-foreground")}>
                      {task.title}
                    </h3>
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-tight flex items-center gap-1">
                      <Star className="w-3 h-3 fill-secondary" /> {task.points} Stars
                    </span>
                  </div>
                </div>
                
                {!isCompleted && (
                  <Button 
                    size="sm" 
                    onClick={() => handleTaskSubmit(task)}
                    disabled={submittingId === task.id}
                    className="rounded-full h-8 px-4 bg-secondary hover:bg-secondary/90 text-[10px] font-bold uppercase tracking-wider"
                  >
                    {submittingId === task.id ? "..." : <><Send className="w-3 h-3 mr-1" /> Submit</>}
                  </Button>
                )}
                
                {isCompleted && (
                  <div className="text-[10px] font-bold py-1 px-3 rounded-full bg-green-500/10 text-green-600 uppercase">
                    Done!
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {!isLoading && user && tasksList.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed rounded-3xl opacity-40">
            <p className="text-sm font-medium">No missions for today yet!</p>
          </div>
        )}
      </section>

      <BottomNav />
    </main>
  );
}
