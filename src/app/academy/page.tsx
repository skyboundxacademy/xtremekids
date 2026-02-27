
"use client"

import { BottomNav } from "@/components/BottomNav";
import { GraduationCap, BookOpen, ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AppLogo } from "@/components/AppLogo";
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
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  return (
    <main className="min-h-screen pb-24 px-6 pt-12 max-w-md mx-auto bg-slate-50/50">
      <header className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <AppLogo />
          <div className="bg-primary/10 px-4 py-2 rounded-2xl flex items-center gap-2">
             <GraduationCap className="w-4 h-4 text-primary" />
             <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">Academy Registry</span>
          </div>
        </div>
      </header>

      <div className="space-y-8">
        {!selectedSubject ? (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Choose Subject</h2>
            <div className="grid grid-cols-2 gap-4">
              {SUBJECTS.map((subj) => (
                <button 
                  key={subj.name}
                  onClick={() => setSelectedSubject(subj.category)}
                  className="relative h-40 rounded-[2rem] overflow-hidden kid-card-shadow group border-none"
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
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setSelectedSubject(null)} className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                <ChevronLeft className="w-3 h-3" /> Back
              </button>
              <h2 className="text-sm font-black text-slate-800 uppercase italic tracking-tighter">{selectedSubject}</h2>
            </div>
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Select Your Class</h2>
            <div className="grid grid-cols-2 gap-3">
              {CLASSES.map((cls) => (
                <Link
                  key={cls}
                  href={`/academy/${selectedSubject}/${cls}`}
                  className="h-16 rounded-2xl bg-white flex items-center justify-center border-2 border-primary/5 kid-card-shadow font-black uppercase text-[10px] tracking-widest italic text-primary hover:bg-primary hover:text-white transition-all text-center p-2"
                >
                  {cls}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
