"use client"

import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, ShieldCheck, Star, Trophy, Pencil, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function ProfilePage() {
  return (
    <main className="min-h-screen pb-24 max-w-md mx-auto">
      {/* Upper profile part */}
      <div className="bg-primary rounded-b-[3rem] px-6 pt-12 pb-24 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <Trophy size={150} />
        </div>
        
        <header className="flex justify-between items-center mb-10">
          <Link href="/admin">
            <Settings className="w-6 h-6 opacity-80" />
          </Link>
          <h2 className="text-xl font-bold">My Profile</h2>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full">
            <Pencil className="w-5 h-5" />
          </Button>
        </header>

        <div className="flex flex-col items-center">
          <div className="w-32 h-32 rounded-[2rem] border-4 border-white/30 bg-white/20 relative p-1 mb-4 overflow-hidden shadow-2xl">
            <Image 
              src="https://picsum.photos/seed/profile-hero/200/200" 
              alt="Profile" 
              fill 
              className="object-cover rounded-[1.8rem]"
              data-ai-hint="cartoon boy"
            />
          </div>
          <h1 className="text-2xl font-black mb-1">Super Leo</h1>
          <p className="text-white/80 font-medium flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Skybound Academy
          </p>
        </div>
      </div>

      {/* Stats and Achievements */}
      <div className="px-6 -mt-12">
        <Card className="border-none kid-card-shadow bg-white rounded-3xl mb-8">
          <CardContent className="p-8 grid grid-cols-2 gap-8 text-center">
            <div>
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1">Total Stars</p>
              <div className="flex items-center justify-center gap-1">
                <Star className="text-secondary fill-secondary w-5 h-5" />
                <span className="text-3xl font-black text-primary">1,250</span>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1">Lessons Done</p>
              <div className="flex items-center justify-center gap-1">
                <ShieldCheck className="text-primary w-5 h-5" />
                <span className="text-3xl font-black text-primary">12</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="mb-8">
          <h3 className="text-lg font-bold mb-4 px-2">My Badges</h3>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-primary/5">
                  <Trophy className={cn("w-7 h-7", i < 4 ? "text-secondary" : "text-muted opacity-30")} />
                </div>
                <span className="text-[8px] font-bold text-muted-foreground uppercase">Tier {i}</span>
              </div>
            ))}
          </div>
        </section>

        <Button className="w-full rounded-2xl h-14 bg-white border-2 border-primary/10 text-primary hover:bg-primary/5 font-bold shadow-sm">
          Log Out
        </Button>
      </div>

      <BottomNav />
    </main>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}