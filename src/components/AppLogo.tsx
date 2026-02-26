
"use client"

import { cn } from "@/lib/utils";

interface AppLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function AppLogo({ className, size = 40, showText = true }: AppLogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div 
        style={{ width: size, height: size }} 
        className="bg-primary rounded-xl flex items-center justify-center p-1.5 shadow-lg shadow-primary/20 shrink-0"
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white">
          <path 
            d="M20 20 L80 80 M80 20 L20 80" 
            stroke="currentColor" 
            strokeWidth="15" 
            strokeLinecap="round" 
            className="drop-shadow-sm"
          />
          <path 
            d="M50 20 L50 80" 
            stroke="currentColor" 
            strokeWidth="8" 
            strokeLinecap="round" 
            opacity="0.3"
          />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="text-primary font-black italic tracking-tighter uppercase text-lg">skyX</span>
          <span className="text-slate-400 font-bold tracking-widest uppercase text-[10px]">bound</span>
        </div>
      )}
    </div>
  );
}
