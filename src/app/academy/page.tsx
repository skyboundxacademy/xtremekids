
"use client"

import { BottomNav } from "@/components/BottomNav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Cloud, Search, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy, where, getDocs } from "firebase/firestore";

export default function AcademyPage() {
  const [search, setSearch] = useState("");
  const { user } = useUser();
  const db = useFirestore();
  const [completedTitles, setCompletedTitles] = useState<Set<string>>(new Set());

  const lessonsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'lessons'), orderBy('createdAt', 'desc'));
  }, [db, user]);

  const { data: lessons, isLoading } = useCollection<any>(lessonsQuery);

  useEffect(() => {
    if (!user) return;
    const fetchCompletion = async () => {
      const q = query(collection(db, "submissions"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      const titles = new Set(snapshot.docs.map(doc => doc.data().taskTitle));
      setCompletedTitles(titles);
    };
    fetchCompletion();
  }, [user, db]);

  const filteredLessons = lessons?.filter(l => 
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.category.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <main className="min-h-screen pb-24 px-6 pt-12 max-w-md mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-2">
          Academy <Cloud className="text-primary/20 fill-primary/5" />
        </h1>
        <p className="text-muted-foreground font-medium mb-6">What will you learn today?</p>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            className="pl-10 rounded-2xl border-primary/10 bg-white h-12" 
            placeholder="Search for lessons..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <section className="space-y-6">
        {(isLoading || !user) && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {!isLoading && user && filteredLessons.map((lesson) => {
          const isDone = completedTitles.has(`Completed Lesson: ${lesson.title}`);
          return (
            <Link key={lesson.id} href={`/academy/${lesson.id}`}>
              <Card className={`overflow-hidden border-none kid-card-shadow relative bg-white group active:scale-95 transition-transform mb-6 ${isDone ? 'opacity-70' : ''}`}>
                <div className={`diary-tape ${isDone ? 'bg-green-500/20' : 'bg-secondary/20'}`} />
                <div className="relative h-48 w-full">
                  <Image 
                    src={lesson.imageUrl || "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800"} 
                    alt={lesson.title} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform"
                    unoptimized
                  />
                  <Badge className={`absolute top-4 left-4 border-none ${isDone ? 'bg-green-600' : 'bg-primary/80 backdrop-blur-md'}`}>
                    {isDone ? 'Completed' : lesson.category}
                  </Badge>
                  {isDone && (
                    <div className="absolute top-4 right-4 bg-white rounded-full p-1 shadow-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                  )}
                </div>
                <CardContent className="p-5">
                  <h3 className={`text-xl font-bold mb-2 text-primary ${isDone ? 'line-through opacity-50' : ''}`}>{lesson.title}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-4 font-medium italic">
                    {lesson.description || "A deep dive into this amazing topic!"}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                      {isDone ? 'View Again' : 'Start Lesson'}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}

        {!isLoading && user && filteredLessons.length === 0 && (
          <div className="text-center py-20">
            <Cloud className="w-16 h-16 mx-auto text-primary/10 mb-4" />
            <p className="font-bold text-primary/40">No lessons found matching that!</p>
          </div>
        )}
      </section>

      <BottomNav />
    </main>
  );
}
