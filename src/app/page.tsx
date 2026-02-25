
"use client"

import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Cloud, Star, Sparkles, Trophy, FlaskConical, ClipboardList } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

export default function Home() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  
  const userProfileRef = useMemoFirebase(() => {
    return user ? doc(db, 'users', user.uid) : null;
  }, [db, user]);
  
  const { data: profile } = useDoc<any>(userProfileRef);

  useEffect(() => {
    setMounted(true);
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (!mounted || isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Sparkles className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen pb-24 px-6 pt-12 max-w-md mx-auto">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            Hi, {profile?.displayName || 'Explorer'}! <Sparkles className="text-secondary animate-pulse" />
          </h1>
          <p className="text-muted-foreground font-medium">Ready for an adventure today?</p>
        </div>
        <div className="bg-white p-2 rounded-full shadow-lg border-2 border-primary/10">
          <Link href="/profile">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/20 relative">
              <Image 
                src={user?.photoURL || "https://picsum.photos/seed/avatar-hero/100/100"} 
                alt="Avatar" 
                fill 
                className="object-cover"
                data-ai-hint="cartoon character"
              />
            </div>
          </Link>
        </div>
      </header>

      <Card className="bg-white/60 backdrop-blur-sm mb-8 border-none kid-card-shadow relative overflow-hidden">
        <div className="diary-tape bg-primary/30" />
        <CardContent className="p-6 flex justify-around items-center">
          <div className="flex flex-col items-center">
            <div className="bg-secondary/20 p-3 rounded-2xl mb-2">
              <Star className="text-secondary fill-secondary" />
            </div>
            <span className="text-lg font-bold">{profile?.totalStars || 0}</span>
            <span className="text-xs text-muted-foreground uppercase font-semibold">Stars</span>
          </div>
          <div className="w-px h-12 bg-primary/10" />
          <div className="flex flex-col items-center">
            <div className="bg-primary/20 p-3 rounded-2xl mb-2">
              <Trophy className="text-primary" />
            </div>
            <span className="text-lg font-bold">{profile?.badges?.length || 0}</span>
            <span className="text-xs text-muted-foreground uppercase font-semibold">Badges</span>
          </div>
        </CardContent>
      </Card>

      <section className="mb-8">
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Cloud className="text-primary/40 fill-primary/10" /> Top Pick
          </h2>
          <Link href="/academy" className="text-xs font-bold text-primary">See All</Link>
        </div>
        <Link href="/academy">
          <div className="group relative rounded-3xl overflow-hidden aspect-[16/10] kid-card-shadow transition-transform active:scale-95">
            <Image 
              src="https://picsum.photos/seed/featured/800/500" 
              alt="Featured Lesson" 
              fill 
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              data-ai-hint="colorful space"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent flex flex-col justify-end p-6">
              <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase py-1 px-3 rounded-full w-fit mb-2">
                New Adventure
              </span>
              <h3 className="text-white text-2xl font-bold">The Secret of the Moon</h3>
            </div>
          </div>
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <Button asChild variant="outline" className="h-24 flex flex-col gap-1 rounded-3xl bg-white border-2 border-primary/5 kid-card-shadow hover:bg-primary/5 group">
          <Link href="/lab">
            <div className="bg-primary/10 p-2 rounded-xl group-hover:rotate-12 transition-transform">
              <FlaskConical className="text-primary" />
            </div>
            <span className="font-bold text-sm">Magic Lab</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-24 flex flex-col gap-1 rounded-3xl bg-white border-2 border-secondary/5 kid-card-shadow hover:bg-secondary/5 group">
          <Link href="/tasks">
            <div className="bg-secondary/10 p-2 rounded-xl group-hover:-rotate-12 transition-transform">
              <ClipboardList className="text-secondary" />
            </div>
            <span className="font-bold text-sm">Daily Tasks</span>
          </Link>
        </Button>
      </section>

      <BottomNav />
    </main>
  );
}
