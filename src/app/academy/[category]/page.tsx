
"use client"

import { useParams, useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

const CLASSES = [
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
  "JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"
];

export default function CategoryClassesPage() {
  const { category } = useParams();
  const router = useRouter();
  const decodedCategory = decodeURIComponent(category as string);

  return (
    <main className="min-h-screen pb-24 px-6 pt-12 max-w-md mx-auto bg-slate-50/50">
      <header className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white kid-card-shadow flex items-center justify-center text-primary">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none">
              Subject Level
            </h1>
            <p className="text-xl font-black text-primary uppercase italic tracking-tighter">
              {decodedCategory}
            </p>
          </div>
        </div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 italic">Select Your Class Level</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {CLASSES.map((cls) => (
          <Link
            key={cls}
            href={`/academy/${encodeURIComponent(decodedCategory)}/${encodeURIComponent(cls)}`}
            className="h-16 rounded-2xl bg-white flex items-center justify-center border-2 border-primary/5 kid-card-shadow font-black uppercase text-[10px] tracking-widest italic text-primary hover:bg-primary hover:text-white transition-all text-center p-2 bouncy-hover"
          >
            {cls}
          </Link>
        ))}
      </div>

      <BottomNav />
    </main>
  );
}
