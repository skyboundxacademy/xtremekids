
"use client"

import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, ShieldCheck, Star, Trophy, Pencil, MapPin, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from "@/firebase";
import { doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(() => {
    return user ? doc(db, 'users', user.uid) : null;
  }, [db, user]);
  
  const { data: profile, isLoading: isProfileLoading } = useDoc<any>(userProfileRef);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (isUserLoading || isProfileLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <main className="min-h-screen pb-24 max-w-md mx-auto">
      <div className="bg-primary rounded-b-[3rem] px-6 pt-12 pb-24 text-white relative">
        <header className="flex justify-between items-center mb-10">
          <Link href="/admin">
            <Settings className={cn("w-6 h-6 opacity-80", profile?.role !== 'admin' && "hidden")} />
          </Link>
          <h2 className="text-xl font-bold">My Profile</h2>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full"><Pencil className="w-5 h-5" /></Button>
        </header>

        <div className="flex flex-col items-center">
          <div className="w-32 h-32 rounded-[2rem] border-4 border-white/30 bg-white/20 relative p-1 mb-4 overflow-hidden shadow-2xl">
            <Image src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/200/200`} alt="Profile" fill className="object-cover rounded-[1.8rem]" />
          </div>
          <h1 className="text-2xl font-black mb-1">{profile?.displayName || "Explorer"}</h1>
          <p className="text-white/80 font-medium flex items-center gap-1"><MapPin className="w-3 h-3" /> Skybound Academy</p>
        </div>
      </div>

      <div className="px-6 -mt-12">
        <Card className="border-none kid-card-shadow bg-white rounded-3xl mb-8">
          <CardContent className="p-8 grid grid-cols-2 gap-8 text-center">
            <div>
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1">Total Stars</p>
              <div className="flex items-center justify-center gap-1">
                <Star className="text-secondary fill-secondary w-5 h-5" />
                <span className="text-3xl font-black text-primary">{profile?.totalStars || 0}</span>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1">Status</p>
              <div className="flex items-center justify-center gap-1">
                <ShieldCheck className="text-primary w-5 h-5" />
                <span className="text-3xl font-black text-primary capitalize">{profile?.role || 'Student'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="mb-8">
          <Button onClick={handleLogout} className="w-full rounded-2xl h-14 bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 font-bold shadow-sm">
            Log Out
          </Button>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
