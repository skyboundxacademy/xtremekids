
'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Login Failed', description: error.message });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      router.push('/');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Google Login Failed', description: error.message });
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md rounded-[2.5rem] border-none kid-card-shadow overflow-hidden bg-white">
        <div className="bg-primary h-32 flex items-center justify-center relative">
          <Sparkles className="text-white w-12 h-12 animate-pulse" />
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-full p-4 kid-card-shadow">
            <LogIn className="text-primary w-8 h-8" />
          </div>
        </div>
        <CardHeader className="pt-10 text-center">
          <CardTitle className="text-2xl font-black text-primary">Welcome Back!</CardTitle>
          <p className="text-muted-foreground font-medium">Ready for another adventure?</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
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
            <Button type="submit" className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold">
              Let's Go!
            </Button>
          </form>
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-muted"></div>
            <span className="flex-shrink mx-4 text-muted-foreground text-xs uppercase font-bold">Or</span>
            <div className="flex-grow border-t border-muted"></div>
          </div>
          <Button onClick={handleGoogleLogin} variant="outline" className="w-full h-12 rounded-xl border-primary/20">
            Sign in with Google
          </Button>
          <p className="text-center text-sm font-medium pt-4">
            New here? <Link href="/signup" className="text-primary font-bold">Create an account</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
