"use client"

import { BottomNav } from "@/components/BottomNav";
import { mockTasks } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Circle, Cloud, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

export default function TasksPage() {
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
            "border-none kid-card-shadow transition-all",
            task.completed ? "bg-primary/5 opacity-80" : "bg-white"
          )}>
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center",
                  task.completed ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
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
              <div className="text-[10px] font-bold py-1 px-3 rounded-full bg-secondary/10 text-secondary uppercase">
                {task.type}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <BottomNav />
    </main>
  );
}