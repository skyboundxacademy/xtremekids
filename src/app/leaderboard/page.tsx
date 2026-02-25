
"use client"

import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Star, CheckCircle2, Cloud, Loader2 } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy, limit, where, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import Image from "next/image";

interface LeaderboardUser {
  id: string;
  displayName: string;
  totalStars: number;
  photoURL?: string;
  hasGreenTick?: boolean;
}

export default function LeaderboardPage() {
  const { user } = useUser();
  const db = useFirestore();
  
  const usersQuery = useMemoFirebase(() => {
    return query(collection(db, 'users'), orderBy('totalStars', 'desc'), limit(50));
  }, [db]);

  const { data: users, isLoading } = useCollection<any>(usersQuery);
  const [activeStatus, setActiveStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!users) return;

    // Logic for Green Tick: Check if user completed 10 lessons and 6 tasks TODAY
    const checkActiveStatus = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const statusMap: Record<string, boolean> = {};

      for (const u of users) {
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

        if (lessonCount >= 10 && taskCount >= 6) {
          statusMap[u.id] = true;
        }
      }
      setActiveStatus(statusMap);
    };

    checkActiveStatus();
  }, [users, db]);

  return (
    <main className="min-h-screen pb-24 px-6 pt-12 max-w-md mx-auto">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center justify-center gap-2">
          Star Hall <Trophy className="text-yellow-500" />
        </h1>
        <p className="text-muted-foreground font-medium">Top Explorers of the Academy!</p>
      </header>

      <section className="space-y-4">
        {isLoading && (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {users?.map((u, index) => (
          <Card key={u.id} className={`border-none kid-card-shadow relative overflow-hidden ${u.id === user?.uid ? 'bg-primary/5 border-2 border-primary/20' : 'bg-white'}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-black text-xl text-primary/40 w-6">#{index + 1}</span>
                <div className="w-12 h-12 rounded-2xl overflow-hidden relative border-2 border-primary/10">
                  <Image src={u.photoURL || `https://picsum.photos/seed/${u.id}/100/100`} alt={u.displayName} fill className="object-cover" />
                </div>
                <div>
                  <h3 className="font-bold flex items-center gap-1">
                    {u.displayName || "Explorer"}
                    {activeStatus[u.id] && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  </h3>
                  <div className="flex items-center gap-1 text-secondary">
                    <Star className="w-3 h-3 fill-secondary" />
                    <span className="text-xs font-bold">{u.totalStars || 0} Stars</span>
                  </div>
                </div>
              </div>
              
              {index < 3 && (
                <div className="bg-yellow-100 p-2 rounded-xl">
                  <Trophy className={`w-5 h-5 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-slate-400' : 'text-orange-400'}`} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {users?.length === 0 && !isLoading && (
          <div className="text-center py-20 opacity-30">
            <Cloud className="w-16 h-16 mx-auto mb-4" />
            <p className="font-bold">No explorers yet!</p>
          </div>
        )}
      </section>

      <BottomNav />
    </main>
  );
}
