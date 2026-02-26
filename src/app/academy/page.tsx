
"use client"

import { BottomNav } from "@/components/BottomNav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Cloud, Search, ArrowRight, Loader2, CheckCircle2, GraduationCap, Compass } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy, where, getDocs } from "firebase/firestore";
import { AppLogo } from "@/components/AppLogo";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = ["Mathematics", "English", "Science", "ICT", "Social Studies", "General"];

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
      const q = query(
        collection(db, "submissions"), 
        where("userId", "==", user.uid)
      );
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

  const enrolledLessons = filteredLessons.filter(l => completedTitles.has(`Completed Lesson: ${l.title}`));
  const browseLessons = filteredLessons.filter(l => !completedTitles.has(`Completed Lesson: ${l.title}`));

  const LessonGrid = ({ list }: { list: any[] }) => (
    <div className="space-y-6">
      {list.map((lesson) => (
        <Link key={lesson.id} href={`/academy/${lesson.id}`}>
          <Card className="overflow-hidden border-none kid-card-shadow bg-white group active:scale-95 transition-all mb-6">
            <div className="relative h-48 w-full">
              <Image 
                src={lesson.imageUrl || `https://picsum.photos/seed/${lesson.title}/800/600`} 
                alt={lesson.title} 
                fill 
                className="object-cover group-hover:scale-105 transition-transform"
                unoptimized
              />
              <Badge className="absolute top-4 left-4 border-none bg-primary/80 backdrop-blur-md">
                {lesson.category}
              </Badge>
              {completedTitles.has(`Completed Lesson: ${lesson.title}`) && (
                <div className="absolute top-4 right-4 bg-white rounded-full p-1 shadow-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
              )}
            </div>
            <CardContent className="p-5">
              <h3 className="text-xl font-black mb-1 text-primary">{lesson.title}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">Class: {lesson.targetClass || "Academy"}</p>
              <p className="text-muted-foreground text-sm line-clamp-2 mb-4 font-medium italic">
                {lesson.description || "Elite academic path for global thinkers."}
              </p>
              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <span className="text-[10px] font-black text-secondary uppercase tracking-wider">
                  {completedTitles.has(`Completed Lesson: ${lesson.title}`) ? 'Certified Explorer' : 'Begin Journey'}
                </span>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );

  return (
    <main className="min-h-screen pb-24 px-6 pt-12 max-w-md mx-auto bg-slate-50/50">
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <AppLogo />
          <GraduationCap className="text-primary/20 fill-primary/5 animate-float" />
        </div>
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            className="pl-12 rounded-[2rem] border-none bg-white h-14 kid-card-shadow text-base italic" 
            placeholder="Search academic paths..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <Tabs defaultValue="browse">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-white p-1 rounded-[2rem] kid-card-shadow h-16">
          <TabsTrigger value="browse" className="rounded-3xl font-black uppercase tracking-tighter text-xs">
            <Compass className="w-4 h-4 mr-2" /> Browse
          </TabsTrigger>
          <TabsTrigger value="enrolled" className="rounded-3xl font-black uppercase tracking-tighter text-xs">
            <GraduationCap className="w-4 h-4 mr-2" /> Enrolled
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-6">
            {CATEGORIES.map(cat => (
              <Badge key={cat} variant="outline" className="shrink-0 px-4 py-2 rounded-full border-primary/20 font-black text-[10px] uppercase tracking-widest text-primary cursor-pointer hover:bg-primary/5">
                {cat}
              </Badge>
            ))}
          </div>
          {isLoading ? <div className="space-y-4"><Skeleton className="h-64 w-full rounded-3xl" /><Skeleton className="h-64 w-full rounded-3xl" /></div> : <LessonGrid list={browseLessons} />}
        </TabsContent>

        <TabsContent value="enrolled">
          {isLoading ? <Skeleton className="h-64 w-full rounded-3xl" /> : enrolledLessons.length > 0 ? <LessonGrid list={enrolledLessons} /> : (
            <div className="text-center py-20 bg-white rounded-[2rem] kid-card-shadow">
              <Compass className="w-12 h-12 text-primary/10 mx-auto mb-4" />
              <p className="font-black text-slate-400 uppercase tracking-widest italic">No finished courses yet!</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <BottomNav />
    </main>
  );
}
