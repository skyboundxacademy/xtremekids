
"use client"

import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cloud, Star, Sparkles, Trophy, Loader2, ArrowRight, BookOpen, ChevronRight, ClipboardList } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query, limit, orderBy } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [lessonIndex, setLessonIndex] = useState(0);
  
  const userProfileRef = useMemoFirebase(() => {
    return user ? doc(db, 'users', user.uid) : null;
  }, [db, user]);
  
  const { data: profile, isLoading: isProfileLoading } = useDoc<any>(userProfileRef);

  const topLessonsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'lessons'), orderBy('createdAt', 'desc'), limit(3));
  }, [db, user]);
  const { data: topLessons, isLoading: isLessonsLoading } = useCollection<any>(topLessonsQuery);

  const leaderboardQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'users'), orderBy('totalStars', 'desc'), limit(5));
  }, [db, user]);
  const { data: topUsers, isLoading: isLeaderboardLoading } = useCollection<any>(leaderboardQuery);

  useEffect(() => {
    setMounted(true);
    if (!isUserLoading && user && profile && profile.onboardingCompleted === false) {
      router.push("/onboarding");
    }
  }, [user, isUserLoading, profile, router]);

  useEffect(() => {
    if (!topLessons || topLessons.length <= 1) return;
    const interval = setInterval(() => {
      setLessonIndex((prev) => (prev + 1) % topLessons.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [topLessons]);

  if (!mounted || isUserLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" /></div>;
  }

  if (!user && !isUserLoading) {
    router.push('/login');
    return null;
  }

  return (
    <main className="min-h-screen pb-32 px-6 pt-12 max-w-md mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-primary leading-tight">
            Skybound <Sparkles className="inline text-secondary animate-pulse" />
          </h1>
          <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">
            {isProfileLoading ? <Skeleton className="h-4 w-24 mt-1" /> : `Hi, ${profile?.displayName || "Explorer"}`}
          </p>
        </div>
        <Link href="/profile" className="w-12 h-12 rounded-2xl bg-primary/10 border-2 border-primary/20 overflow-hidden relative">
          <Image src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/100/100`} alt="Avatar" fill className="object-cover" unoptimized />
        </Link>
      </header>

      {/* Featured Lesson Skeleton Loading */}
      <section className="mb-8">
        <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
          Featured Course <Sparkles className="w-3 h-3 text-secondary" />
        </h2>
        {isLessonsLoading ? (
          <Skeleton className="h-44 w-full rounded-[2rem]" />
        ) : topLessons && topLessons.length > 0 ? (
          <Link href={`/academy/${topLessons[lessonIndex].id}`}>
            <Card className="border-none kid-card-shadow bg-primary text-white rounded-[2rem] overflow-hidden relative h-44 group">
              <Image 
                src={topLessons[lessonIndex].imageUrl || `https://picsum.photos/seed/${topLessons[lessonIndex].id}/800/600`} 
                alt="Banner" 
                fill 
                className="object-cover opacity-40 group-hover:scale-105 transition-transform" 
                unoptimized
              />
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <span className="text-[10px] font-bold uppercase mb-1 opacity-80">{topLessons[lessonIndex].category}</span>
                <h3 className="text-xl font-black leading-tight mb-2">{topLessons[lessonIndex].title}</h3>
                <div className="flex items-center gap-1 text-[10px] font-bold">
                  Start Learning <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </Card>
          </Link>
        ) : (
          <div className="h-44 bg-slate-100 rounded-[2rem] flex items-center justify-center text-xs font-bold text-slate-400 italic">No courses available yet!</div>
        )}
      </section>

      {/* Stats Skeleton Loading */}
      <section className="grid grid-cols-2 gap-4 mb-8">
        <Card className="bg-primary/5 border-none kid-card-shadow rounded-3xl p-6 text-center">
          <div className="bg-primary/20 w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center">
            <Star className="text-primary fill-primary w-5 h-5" />
          </div>
          {isProfileLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : <p className="text-2xl font-black text-primary">{profile?.totalStars || 0}</p>}
          <p className="text-[10px] font-bold text-primary/60 uppercase">Stars</p>
        </Card>
        <Card className="bg-secondary/5 border-none kid-card-shadow rounded-3xl p-6 text-center">
          <div className="bg-secondary/20 w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center">
            <Trophy className="text-secondary w-5 h-5" />
          </div>
          {isProfileLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : <p className="text-2xl font-black text-secondary">{profile?.badges?.length || 0}</p>}
          <p className="text-[10px] font-bold text-secondary/60 uppercase">Badges</p>
        </Card>
      </section>

      {/* Leaderboard Skeleton Loading */}
      <section className="mb-8">
        <h2 className="text-xl font-black text-primary mb-4 flex items-center gap-2">
          Star Hall <Trophy className="text-yellow-500 w-5 h-5" />
        </h2>
        <Card className="border-none kid-card-shadow bg-white rounded-[2rem] overflow-hidden">
          <div className="p-6 space-y-4">
            {isLeaderboardLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-4 h-4" />
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-10" />
                </div>
              ))
            ) : topUsers?.map((u, i) => (
              <div key={u.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <span className="font-black text-primary/20 w-4">#{i+1}</span>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 relative overflow-hidden">
                    <Image src={u.photoURL || `https://picsum.photos/seed/${u.id}/50/50`} alt={u.displayName} fill className="object-cover" unoptimized />
                  </div>
                  <span className="font-bold text-sm text-slate-700">{u.displayName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-black text-secondary">{u.totalStars}</span>
                  <Star className="w-3 h-3 fill-secondary text-secondary" />
                </div>
              </div>
            ))}
          </div>
          <Button asChild variant="ghost" className="w-full h-12 bg-primary/5 rounded-none text-primary font-bold border-t border-primary/5">
            <Link href="/leaderboard">Full Rankings <ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
        </Card>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <Button asChild className="h-28 flex flex-col gap-2 rounded-3xl bg-white border-none kid-card-shadow hover:bg-slate-50 transition-colors">
          <Link href="/academy">
            <BookOpen className="w-6 h-6 text-primary" />
            <span className="text-primary font-bold text-sm">Academy</span>
          </Link>
        </Button>
        <Button asChild className="h-28 flex flex-col gap-2 rounded-3xl bg-white border-none kid-card-shadow hover:bg-slate-50 transition-colors">
          <Link href="/tasks">
            <ClipboardList className="w-6 h-6 text-secondary" />
            <span className="text-secondary font-bold text-sm">Tasks</span>
          </Link>
        </Button>
      </section>

      <BottomNav />
    </main>
  );
}
