
"use client"

import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cloud, Star, Sparkles, Trophy, FlaskConical, ClipboardList, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query, limit, orderBy } from "firebase/firestore";

export default function Home() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  
  const userProfileRef = useMemoFirebase(() => {
    return user ? doc(db, 'users', user.uid) : null;
  }, [db, user]);
  
  const { data: profile } = useDoc<any>(userProfileRef);

  const leaderboardQuery = useMemoFirebase(() => {
    return query(collection(db, 'users'), orderBy('totalStars', 'desc'), limit(5));
  }, [db]);
  const { data: topUsers } = useCollection<any>(leaderboardQuery);

  useEffect(() => {
    setMounted(true);
    if (!isUserLoading && user && profile && !profile.onboardingCompleted) {
      router.push("/onboarding");
    }
  }, [user, isUserLoading, profile, router]);

  if (!mounted || isUserLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" /></div>;
  }

  if (!user) return null;

  return (
    <main className="min-h-screen pb-32 px-6 pt-12 max-w-md mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-primary leading-tight">
            Skybound <Sparkles className="inline text-secondary animate-pulse" />
          </h1>
          <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">Hi, {profile?.displayName || "Explorer"}</p>
        </div>
        <Link href="/profile" className="w-12 h-12 rounded-2xl bg-primary/10 border-2 border-primary/20 overflow-hidden relative">
          <Image src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`} alt="Avatar" fill className="object-cover" />
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-4 mb-8">
        <Card className="bg-primary/5 border-none kid-card-shadow rounded-3xl p-6 text-center">
          <div className="bg-primary/20 w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center">
            <Star className="text-primary fill-primary w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-primary">{profile?.totalStars || 0}</p>
          <p className="text-[10px] font-bold text-primary/60 uppercase">Stars</p>
        </Card>
        <Card className="bg-secondary/5 border-none kid-card-shadow rounded-3xl p-6 text-center">
          <div className="bg-secondary/20 w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center">
            <Trophy className="text-secondary w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-secondary">{profile?.badges?.length || 0}</p>
          <p className="text-[10px] font-bold text-secondary/60 uppercase">Badges</p>
        </Card>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-black text-primary mb-4 flex items-center gap-2">
          Star Hall <Trophy className="text-yellow-500 w-5 h-5" />
        </h2>
        <Card className="border-none kid-card-shadow bg-white rounded-[2rem] overflow-hidden">
          <div className="p-6 space-y-4">
            {topUsers?.map((u, i) => (
              <div key={u.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <span className="font-black text-primary/20 w-4">#{i+1}</span>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 relative overflow-hidden">
                    <Image src={u.photoURL || `https://picsum.photos/seed/${u.id}/50/50`} alt={u.displayName} fill className="object-cover" />
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
