
'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: name });
      
      // Create user profile in Firestore
      setDoc(doc(db, 'users', user.uid), {
        displayName: name,
        totalStars: 0,
        badges: [],
        role: 'student',
        createdAt: new Date().toISOString()
      });

      router.push('/');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Sign up Failed', description: error.message });
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md rounded-[2.5rem] border-none kid-card-shadow overflow-hidden bg-white">
        <div className="bg-secondary h-32 flex items-center justify-center relative">
          <Sparkles className="text-white w-12 h-12 animate-pulse" />
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-full p-4 kid-card-shadow">
            <UserPlus className="text-secondary w-8 h-8" />
          </div>
        </div>
        <CardHeader className="pt-10 text-center">
          <CardTitle className="text-2xl font-black text-secondary">Join the Adventure!</CardTitle>
          <p className="text-muted-foreground font-medium">Create your Explorer profile</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSignup} className="space-y-4">
            <Input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl h-12"
              required
            />
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl h-12"
              required
            />
            <Input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl h-12"
              required
            />
            <Button type="submit" className="w-full h-12 rounded-xl bg-secondary hover:bg-secondary/90 font-bold">
              Start Exploring!
            </Button>
          </form>
          <p className="text-center text-sm font-medium pt-4">
            Already have an account? <Link href="/login" className="text-secondary font-bold">Log in here</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
