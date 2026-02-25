
"use client"

import { BottomNav } from "@/components/BottomNav";
import { mockTasks } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Circle, Cloud, Sparkles, Star, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useUser, useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Button } from "@/components/ui/button";

export default function TasksPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [submittingId, setSubmittingId] = useState<string | null>(null);

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

  const completedCount = mockTasks.filter(t => t.completed).length;
  const progress = (completedCount / mockTasks.length) * 100;

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
        {mockTasks.map((task) => (
          <Card key={task.id} className={cn(
            "border-none kid-card-shadow transition-all group",
            task.completed ? "bg-primary/5 opacity-80" : "bg-white"
          )}>
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors",
                  task.completed ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:bg-primary/10"
                )}>
                  {task.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className={cn("font-bold", task.completed && "line-through text-muted-foreground")}>
                    {task.title}
                  </h3>
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-tight flex items-center gap-1">
                    <Star className="w-3 h-3 fill-secondary" /> {task.points} Stars
                  </span>
                </div>
              </div>
              
              {!task.completed && (
                <Button 
                  size="sm" 
                  onClick={() => handleTaskSubmit(task)}
                  disabled={submittingId === task.id}
                  className="rounded-full h-8 px-4 bg-secondary hover:bg-secondary/90 text-[10px] font-bold uppercase tracking-wider"
                >
                  {submittingId === task.id ? "..." : <><Send className="w-3 h-3 mr-1" /> Submit</>}
                </Button>
              )}
              
              {task.completed && (
                <div className="text-[10px] font-bold py-1 px-3 rounded-full bg-green-500/10 text-green-600 uppercase">
                  Done!
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </section>

      <BottomNav />
    </main>
  );
}
