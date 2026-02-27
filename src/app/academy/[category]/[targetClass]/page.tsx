
"use client"

import { useParams, useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, BookOpen, ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy, where, getDocs } from "firebase/firestore";
import { AppLogo } from "@/components/AppLogo";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClassLessonsPage() {
  const { category, targetClass } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const [completedTitles, setCompletedTitles] = useState<Set<string>>(new Set());

  const lessonsQuery = useMemoFirebase(() => {
    if (!user || !category || !targetClass) return null;
    return query(
      collection(db, 'lessons'), 
      where('category', '==', decodeURIComponent(category as string)),
      where('targetClass', '==', decodeURIComponent(targetClass as string)),
      orderBy('createdAt', 'desc')
    );
  }, [db, user, category, targetClass]);

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

  return (
    <main className="min-h-screen pb-24 px-6 pt-12 max-w-md mx-auto bg-slate-50/50">
      <header className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white kid-card-shadow flex items-center justify-center text-primary">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none">
              {decodeURIComponent(category as string)}
            </h1>
            <p className="text-xl font-black text-primary uppercase italic tracking-tighter">
              {decodeURIComponent(targetClass as string)}
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-6">
        {isLoading ? (
          <Skeleton className="h-48 w-full rounded-[2.5rem]" />
        ) : lessons && lessons.length > 0 ? (
          lessons.map((lesson: any) => (
            <Link key={lesson.id} href={`/academy/${category}/${targetClass}/${lesson.id}`}>
              <Card className="overflow-hidden border-none kid-card-shadow bg-white group active:scale-95 transition-all">
                <div className="relative h-40 w-full">
                  <Image 
                    src={lesson.imageUrl || `https://picsum.photos/seed/${lesson.title}/800/600`} 
                    alt={lesson.title} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform"
                    unoptimized
                  />
                  {completedTitles.has(`Completed Lesson: ${lesson.title}`) && (
                    <div className="absolute top-4 right-4 bg-white rounded-full p-1 shadow-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                  )}
                </div>
                <CardContent className="p-5">
                  <h3 className="text-lg font-black mb-1 text-primary leading-tight">{lesson.title}</h3>
                  <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-50">
                    <span className="text-[9px] font-black text-secondary uppercase tracking-wider italic">
                      {completedTitles.has(`Completed Lesson: ${lesson.title}`) ? 'Certified Explorer' : 'Start Journey'}
                    </span>
                    <ArrowRight className="w-4 h-4 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-[2.5rem] kid-card-shadow border-2 border-dashed border-primary/10">
            <BookOpen className="w-12 h-12 text-primary/10 mx-auto mb-4" />
            <p className="font-black text-slate-400 uppercase tracking-widest italic text-xs px-10">Professor Sky is still crafting elite paths for this level.</p>
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
