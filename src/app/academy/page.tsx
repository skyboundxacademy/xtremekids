
"use client"

import { BottomNav } from "@/components/BottomNav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, ArrowRight, CheckCircle2, GraduationCap, Compass, BookOpen, ChevronLeft, LayoutGrid, ChevronRight } from "lucide-react";
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
  { name: "Mathematics", icon: "https://picsum.photos/seed/math-class/400/300", category: "Mathematics" },
  { name: "Further Maths", icon: "https://picsum.photos/seed/advanced-calc/400/300", category: "Further Mathematics" },
  { name: "English Language", icon: "https://picsum.photos/seed/library-books/400/300", category: "English Language" },
  { name: "Literature", icon: "https://picsum.photos/seed/story-books/400/300", category: "Literature-in-English" },
  { name: "Physics", icon: "https://picsum.photos/seed/atom-physics/400/300", category: "Physics" },
  { name: "Chemistry", icon: "https://picsum.photos/seed/chemistry-flasks/400/300", category: "Chemistry" },
  { name: "Biology", icon: "https://picsum.photos/seed/microscope-biology/400/300", category: "Biology" },
  { name: "ICT / Data", icon: "https://picsum.photos/seed/coding-laptop/400/300", category: "ICT / Data Processing" },
  { name: "Geography", icon: "https://picsum.photos/seed/earth-globe/400/300", category: "Geography" },
  { name: "Economics", icon: "https://picsum.photos/seed/money-chart/400/300", category: "Economics" },
  { name: "Government", icon: "https://picsum.photos/seed/justice-law/400/300", category: "Government" },
  { name: "Civic Ed", icon: "https://picsum.photos/seed/peace-human/400/300", category: "Civic Education" },
  { name: "Agric Science", icon: "https://picsum.photos/seed/farm-agric/400/300", category: "Agricultural Science" },
  { name: "Financial Acc", icon: "https://picsum.photos/seed/ledger-books/400/300", category: "Financial Accounting" },
  { name: "Commerce", icon: "https://picsum.photos/seed/business-market/400/300", category: "Commerce" },
  { name: "Visual Arts", icon: "https://picsum.photos/seed/painting-art/400/300", category: "Visual Arts" },
  { name: "Tech Drawing", icon: "https://picsum.photos/seed/drawing-plans/400/300", category: "Technical Drawing" },
  { name: "Korean Lang", icon: "https://picsum.photos/seed/seoul-korea/400/300", category: "Korean Language" },
  { name: "French", icon: "https://picsum.photos/seed/paris-france/400/300", category: "French" },
  { name: "Igbo", icon: "https://picsum.photos/seed/nigeria-igbo/400/300", category: "Igbo" },
  { name: "Yoruba", icon: "https://picsum.photos/seed/nigeria-yoruba/400/300", category: "Yoruba" },
  { name: "Hausa", icon: "https://picsum.photos/seed/nigeria-hausa/400/300", category: "Hausa" }
];

const CLASSES = [
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
  "JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"
];

export default function AcademyPage() {
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
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
      try {
        const q = query(collection(db, "submissions"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        const titles = new Set(snapshot.docs.map(doc => doc.data().taskTitle));
        setCompletedTitles(titles);
      } catch (e) {
        console.warn("Completion fetch failed", e);
      }
    };
    fetchCompletion();
  }, [user, db]);

  const filteredLessons = lessons?.filter((l: any) => {
    const matchesSearch = l.title.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = !selectedSubject || l.subject === selectedSubject || l.category === selectedSubject;
    const matchesClass = !selectedClass || l.targetClass === selectedClass;
    return matchesSearch && matchesSubject && matchesClass;
  }) || [];

  const enrolledLessons = lessons?.filter((l: any) => completedTitles.has(`Completed Lesson: ${l.title}`)) || [];

  const LessonGrid = ({ list }: { list: any[] }) => (
    <div className="space-y-6">
      {list.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2.5rem] kid-card-shadow border-2 border-dashed border-primary/10">
          <BookOpen className="w-12 h-12 text-primary/10 mx-auto mb-4" />
          <p className="font-black text-slate-400 uppercase tracking-widest italic text-xs px-10">Professor Sky is still crafting elite paths for this level.</p>
        </div>
      ) : (
        list.map((lesson) => (
          <Link key={lesson.id} href={`/academy/${lesson.category || 'General'}/${lesson.id}`}>
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
                  onClick={() => setSelectedSubject(subj.category)}
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
          ) : !selectedClass ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setSelectedSubject(null)} className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                  <ChevronLeft className="w-3 h-3" /> Back
                </button>
                <h2 className="text-sm font-black text-slate-800 uppercase italic tracking-tighter">{selectedSubject}</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {CLASSES.map((cls) => (
                  <button
                    key={cls}
                    onClick={() => setSelectedClass(cls)}
                    className="h-16 rounded-2xl bg-white border-2 border-primary/5 kid-card-shadow font-black uppercase text-[10px] tracking-widest italic text-primary hover:bg-primary hover:text-white transition-all"
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setSelectedClass(null)} className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                  <ChevronLeft className="w-3 h-3" /> Back to Levels
                </button>
                <div className="text-right">
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedSubject}</h2>
                  <p className="text-sm font-black text-primary uppercase italic tracking-tighter">{selectedClass}</p>
                </div>
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
            <div className="text-center py-20 bg-white rounded-[2rem] kid-card-shadow border-2 border-dashed border-primary/10">
              <Compass className="w-12 h-12 text-primary/10 mx-auto mb-4" />
              <p className="font-black text-slate-400 uppercase tracking-widest italic text-xs px-10">Your academic journey starts here. Explore subjects!</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <BottomNav />
    </main>
  );
}

