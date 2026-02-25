
"use client"

import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, ShieldCheck, Star, Trophy, Pencil, MapPin, UserCheck, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isTogglingRole, setIsTogglingRole] = useState(false);

  const userProfileRef = useMemoFirebase(() => {
    return user ? doc(db, 'users', user.uid) : null;
  }, [db, user]);
  
  const { data: profile, isLoading: isProfileLoading } = useDoc<any>(userProfileRef);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const toggleAdminRole = async () => {
    if (!user || !profile) return;
    setIsTogglingRole(true);
    const newRole = profile.role === 'admin' ? 'student' : 'admin';
    
    updateDoc(doc(db, 'users', user.uid), { role: newRole })
      .then(() => {
        toast({ title: "Role Updated!", description: `You are now a ${newRole}!` });
      })
      .catch(() => {
        toast({ title: "Error", description: "Could not update role.", variant: "destructive" });
      })
      .finally(() => setIsTogglingRole(false));
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-24 max-w-md mx-auto">
      <div className="bg-primary rounded-b-[3rem] px-6 pt-12 pb-24 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <Trophy size={150} />
        </div>
        
        <header className="flex justify-between items-center mb-10">
          <Link href="/admin">
            <Settings className={cn("w-6 h-6 opacity-80", profile?.role !== 'admin' && "hidden")} />
          </Link>
          <h2 className="text-xl font-bold">My Profile</h2>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full">
            <Pencil className="w-5 h-5" />
          </Button>
        </header>

        <div className="flex flex-col items-center">
          <div className="w-32 h-32 rounded-[2rem] border-4 border-white/30 bg-white/20 relative p-1 mb-4 overflow-hidden shadow-2xl">
            <Image 
              src={user?.photoURL || "https://picsum.photos/seed/profile-hero/200/200"} 
              alt="Profile" 
              fill 
              className="object-cover rounded-[1.8rem]"
              data-ai-hint="cartoon boy"
            />
          </div>
          <h1 className="text-2xl font-black mb-1">{profile?.displayName || user?.displayName || 'Explorer'}</h1>
          <p className="text-white/80 font-medium flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Skybound Academy
          </p>
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
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1">Role</p>
              <div className="flex items-center justify-center gap-1">
                <ShieldCheck className="text-primary w-5 h-5" />
                <span className="text-3xl font-black text-primary capitalize">{profile?.role || 'Student'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="mb-8">
          <h3 className="text-lg font-bold mb-4 px-2">Explorer Controls</h3>
          <div className="space-y-4">
            <Button 
              onClick={toggleAdminRole} 
              disabled={isTogglingRole}
              variant="outline" 
              className="w-full rounded-2xl h-14 gap-2 border-primary/20 text-primary font-bold"
            >
              <UserCheck className="w-5 h-5" /> 
              {isTogglingRole ? "Syncing..." : (profile?.role === 'admin' ? "Switch to Student" : "Become Admin (Dev Mode)")}
            </Button>
            
            <Button 
              onClick={handleLogout}
              className="w-full rounded-2xl h-14 bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 font-bold shadow-sm"
            >
              Log Out
            </Button>
          </div>
        </section>

        <section className="mb-8">
          <h3 className="text-lg font-bold mb-4 px-2">My Badges</h3>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-primary/5">
                  <Trophy className={cn("w-7 h-7", (profile?.badges?.length || 0) >= i ? "text-secondary" : "text-muted opacity-30")} />
                </div>
                <span className="text-[8px] font-bold text-muted-foreground uppercase">Level {i}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
