
"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, FlaskConical, ClipboardList, User, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'Academy', icon: BookOpen, href: '/academy' },
  { label: 'Leaderboard', icon: Trophy, href: '/leaderboard' },
  { label: 'Lab', icon: FlaskConical, href: '/lab' },
  { label: 'Tasks', icon: ClipboardList, href: '/tasks' },
  { label: 'Profile', icon: User, href: '/profile' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t border-primary/10 px-4 pb-safe pt-2">
      <div className="max-w-md mx-auto flex justify-between items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300",
                isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-primary/70"
              )}
            >
              <item.icon className={cn("w-6 h-6", isActive && "fill-primary/20")} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && <div className="absolute -top-1 w-1 h-1 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
