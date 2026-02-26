
"use client"

import { BottomNav } from "@/components/BottomNav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, ArrowRight, CheckCircle2, GraduationCap, Compass, BookOpen, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy, where, getDocs } from "firebase/firestore";
import { AppLogo } from "@/components/AppLogo";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const SUBJECTS = [
  { name: "Mathematics", icon: "https://picsum.photos/seed/math/400/300" },
  { name: "Further Mathematics", icon: "https://picsum.photos/seed/math2/400/300" },
  { name: "English Language", icon: "https://picsum.photos/seed/english/400/300" },
  { name: "Literature-in-English", icon: "https://picsum.photos/seed/books/400/300" },
  { name: "Physics", icon: "https://picsum.photos/seed/physics/400/300" },
  { name: "Chemistry", icon: "https://picsum.photos/seed/chemistry/400/300" },
  { name: "Biology", icon: "https://picsum.photos/seed/biology/400/300" },
  { name: "Agricultural Science", icon: "https://picsum.photos/seed/farm/400/300" },
  { name: "Economics", icon: "https://picsum.photos/seed/money/400/300" },
  { name: "Geography", icon: "https://picsum.photos/seed/earth/400/300" },
  { name: "Government", icon: "https://picsum.photos/seed/law/400/300" },
  { name: "Civic Education", icon: "https://picsum.photos/seed/peace/400/300" },
  { name: "Financial Accounting", icon: "https://picsum.photos/seed/account/400/300" },
  { name: "Commerce", icon: "https://picsum.photos/seed/market/400/300" },
  { name: "ICT / Data Processing", icon: "https://picsum.photos/seed/ict/400/300" },
  { name: "Technical Drawing", icon: "https://picsum.photos/seed/draft/400/300" },
  { name: "CRS / IRS", icon: "https://picsum.photos/seed/faith/400/300" },
  { name: "Visual Arts", icon: "https://picsum.photos/seed/art/400/300" }
];

export default function AcademyPage() {
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
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

  const filteredLessons = lessons?.filter(l => {
    const matchesSearch = l.title.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = !selectedSubject || l.subject === selectedSubject || l.category === selectedSubject;
    return matchesSearch && matchesSubject;
  }) || [];

  const enrolledLessons = lessons?.filter(l => completedTitles.has(`Completed Lesson: ${l.title}`)) || [];

  const LessonGrid = ({ list }: { list: any[] }) => (
    <div className="space-y-6">
      {list.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2.5rem] kid-card-shadow">
          <BookOpen className="w-12 h-12 text-primary/10 mx-auto mb-4" />
          <p className="font-black text-slate-400 uppercase tracking-widest italic text-xs px-10">Professor Sky is still crafting paths for this subject.</p>
        </div>
      ) : (
        list.map((lesson) => (
          <Link key={lesson.id} href={`/academy/${lesson.id}`}>
            <Card className="overflow-hidden border-none kid-card-shadow bg-white group active:scale-95 transition-all">
              <div className="relative h-48 w-full">
                <Image 
                  src={lesson.imageUrl || `https://picsum.photos/seed/${lesson.title}/800/600`} 
                  alt={lesson.title} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform"
                  unoptimized
                />
                <Badge className="absolute top-4 left-4 border-none bg-primary/80 backdrop-blur-md">
                  {lesson.subject || lesson.category}
                </Badge>
                {completedTitles.has(`Completed Lesson: ${lesson.title}`) && (
                  <div className="absolute top-4 right-4 bg-white rounded-full p-1 shadow-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                )}
              </div>
              <CardContent className="p-5">
                <h3 className="text-xl font-black mb-1 text-primary leading-tight">{lesson.title}</h3>
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
        ))
      )}
    </div>
  );

  return (
    <main className="min-h-screen pb-24 px-6 pt-12 max-w-md mx-auto bg-slate-50/50">
      <header className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <AppLogo />
          <div className="bg-primary/10 px-4 py-2 rounded-2xl flex items-center gap-2">
             <GraduationCap className="w-4 h-4 text-primary" />
             <span className="text-[10px] font-black text-primary uppercase">Elite Level</span>
          </div>
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
          {!selectedSubject ? (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4">
              {SUBJECTS.map((subj) => (
                <button 
                  key={subj.name}
                  onClick={() => setSelectedSubject(subj.name)}
                  className="relative h-40 rounded-[2rem] overflow-hidden kid-card-shadow group"
                >
                  <Image src={subj.icon} alt={subj.name} fill className="object-cover group-hover:scale-110 transition-transform" unoptimized />
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-4">
                    <span className="text-white font-black uppercase italic tracking-tighter text-center leading-tight">
                      {subj.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setSelectedSubject(null)} className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 rotate-180" /> Back to Subjects
                </button>
                <h2 className="text-sm font-black text-slate-800 uppercase italic tracking-tighter">{selectedSubject}</h2>
              </div>
              {isLoading ? <Skeleton className="h-64 w-full rounded-3xl" /> : <LessonGrid list={filteredLessons} />}
            </div>
          )}
        </TabsContent>

        <TabsContent value="enrolled">
          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-3xl" />
          ) : enrolledLessons.length > 0 ? (
            <LessonGrid list={enrolledLessons} />
          ) : (
            <div className="text-center py-20 bg-white rounded-[2rem] kid-card-shadow">
              <Compass className="w-12 h-12 text-primary/10 mx-auto mb-4" />
              <p className="font-black text-slate-400 uppercase tracking-widest italic text-xs">Your academic journey starts here. Explore subjects!</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <BottomNav />
    </main>
  );
}
