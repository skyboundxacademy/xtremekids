
"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Star, CheckCircle2, ChevronLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy, limit, where, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function LeaderboardPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  
  const usersQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'users'), orderBy('totalStars', 'desc'), limit(50));
  }, [db, user]);

  const { data: users, isLoading } = useCollection<any>(usersQuery);
  const [activeStatus, setActiveStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!users || !db || !user) return;
    
    // Only fetch activity status for admins to avoid permission errors when querying other users' submissions
    const isAdmin = user.email === 'goddikrayz@gmail.com';
    if (!isAdmin) return;

    const checkActiveStatus = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const statusMap: Record<string, boolean> = {};

      for (const u of users) {
        try {
          const q = query(
            collection(db, 'submissions'),
            where('userId', '==', u.id),
            where('status', '==', 'approved'),
            where('timestamp', '>=', today)
          );
          const snapshot = await getDocs(q);
          const docs = snapshot.docs.map(d => d.data());
          const lessonCount = docs.filter(d => d.taskTitle.startsWith('Completed Lesson:')).length;
          const taskCount = docs.length - lessonCount;
          if (lessonCount >= 10 && taskCount >= 6) statusMap[u.id] = true;
        } catch (e) {
          // Silent catch for permission errors on individual students
        }
      }
      setActiveStatus(statusMap);
    };
    checkActiveStatus();
  }, [users, db, user]);

  return (
    <main className="min-h-screen bg-slate-50 pb-24 px-6 pt-12 max-w-md mx-auto">
      <header className="mb-8 flex items-center gap-4">
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="rounded-full bg-white kid-card-shadow"><ChevronLeft /></Button>
        <h1 className="text-2xl font-black text-primary uppercase">Star Hall Hall of Fame</h1>
      </header>

      <section className="space-y-4">
        {isLoading && (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
        )}

        {users?.map((u, index) => (
          <Card key={u.id} className={`border-none kid-card-shadow relative overflow-hidden ${u.id === user?.uid ? 'bg-primary/5 border-2 border-primary/20' : 'bg-white'} rounded-3xl transition-transform active:scale-95`}>
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className={`font-black text-2xl w-8 ${index === 0 ? 'text-yellow-500' : 'text-slate-200'}`}>#{index + 1}</span>
                <div className="w-12 h-12 rounded-2xl overflow-hidden relative border-2 border-primary/10">
                  <Image src={u.photoURL || `https://picsum.photos/seed/${u.id}/100/100`} alt={u.displayName} fill className="object-cover" unoptimized />
                </div>
                <div>
                  <h3 className="font-bold text-slate-700 flex items-center gap-1.5 leading-tight">
                    {u.displayName || "Explorer"}
                    {activeStatus[u.id] && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  </h3>
                  <div className="flex items-center gap-1 text-secondary">
                    <Star className="w-3 h-3 fill-secondary" />
                    <span className="text-[10px] font-black uppercase">{u.totalStars || 0} Stars</span>
                  </div>
                </div>
              </div>
              
              {index < 3 && (
                <div className={`${index === 0 ? 'bg-yellow-100 text-yellow-500' : index === 1 ? 'bg-slate-100 text-slate-400' : 'bg-orange-100 text-orange-400'} p-3 rounded-2xl`}>
                  <Trophy className="w-5 h-5" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
