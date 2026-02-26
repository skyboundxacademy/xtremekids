
"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, FlaskConical, ClipboardList, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { useState, useEffect } from 'react';

const navItems = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'Academy', icon: BookOpen, href: '/academy' },
  { label: 'Lab', icon: FlaskConical, href: '/lab' },
  { label: 'Tasks', icon: ClipboardList, href: '/tasks' },
  { label: 'Profile', icon: User, href: '/profile' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const db = useFirestore();
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    if (!user || !db) return;
    
    // Clean notification query - only look for messages sent to US that are unread
    const q = query(
      collection(db, "messages"),
      where("receiverId", "==", user.uid),
      where("read", "==", false),
      limit(1)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHasNew(!snapshot.empty);
    }, (error) => {
      console.warn("Notification listener status:", error.message);
    });
    
    return () => unsubscribe();
  }, [user, db]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-primary/10 px-4 pb-safe pt-2">
      <div className="max-w-md mx-auto flex justify-between items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const showDot = (item.label === 'Lab' || item.label === 'Home') && hasNew;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 relative",
                isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-primary/70"
              )}
            >
              <item.icon className={cn("w-6 h-6", isActive && "fill-primary/20")} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
              {isActive && <div className="absolute -top-1 w-1 h-1 rounded-full bg-primary" />}
              {showDot && <div className="absolute top-2 right-2 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-pulse" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
