
"use client"

import { BottomNav } from "@/components/BottomNav";
import { GraduationCap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AppLogo } from "@/components/AppLogo";

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

export default function AcademyPage() {
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
        <h1 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter leading-none mb-2">Subject Registry</h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Select your area of expertise</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {SUBJECTS.map((subj) => (
          <Link 
            key={subj.name}
            href={`/academy/${encodeURIComponent(subj.category)}`}
            className="relative h-40 rounded-[2rem] overflow-hidden kid-card-shadow group border-none bouncy-hover"
          >
            <Image 
              src={subj.icon} 
              alt={subj.name} 
              fill 
              className="object-cover group-hover:scale-110 transition-transform" 
              unoptimized 
              data-ai-hint="subject icon"
            />
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-4">
              <span className="text-white font-black uppercase italic tracking-tighter text-center leading-tight">
                {subj.name}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <BottomNav />
    </main>
  );
}
