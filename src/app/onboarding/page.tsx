
"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser, useFirestore } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [age, setAge] = useState("");
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!user || !age) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        age: parseInt(age),
        onboardingCompleted: true
      });
      router.push("/");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md border-none kid-card-shadow bg-white rounded-[2.5rem] overflow-hidden">
        <div className="bg-primary h-32 flex items-center justify-center">
          <Sparkles className="text-white w-12 h-12 animate-pulse" />
        </div>
        <CardHeader className="text-center pt-8">
          <CardTitle className="text-2xl font-black text-primary">Setup Your Profile</CardTitle>
          <p className="text-muted-foreground font-medium">Help Professor Sky tailor your learning!</p>
        </CardHeader>
        <CardContent className="space-y-6 pb-10">
          <div className="space-y-2">
            <Label className="font-bold text-primary">How old are you?</Label>
            <Input 
              type="number" 
              placeholder="Enter your age" 
              value={age} 
              onChange={(e) => setAge(e.target.value)}
              className="h-14 rounded-2xl border-primary/10"
            />
          </div>
          <Button 
            onClick={handleComplete} 
            disabled={loading || !age}
            className="w-full h-14 bg-primary font-bold text-lg rounded-2xl"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Start My Journey <ArrowRight className="ml-2" /></>}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
