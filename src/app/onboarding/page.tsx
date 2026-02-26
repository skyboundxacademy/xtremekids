
"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useUser, useFirestore } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";

const CLASSES = [
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
  "JSS 1", "JSS 2", "JSS 3",
  "SSS 1", "SSS 2", "SSS 3"
];

export default function OnboardingPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [studentClass, setStudentClass] = useState("");
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!user || !studentClass) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        studentClass: studentClass,
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
          <CardTitle className="text-2xl font-black text-primary uppercase">Elite Profile</CardTitle>
          <p className="text-muted-foreground font-medium">Which class are you leading today?</p>
        </CardHeader>
        <CardContent className="space-y-6 pb-10">
          <div className="space-y-2">
            <Label className="font-bold text-primary">Your Class</Label>
            <Select onValueChange={setStudentClass}>
              <SelectTrigger className="h-14 rounded-2xl border-primary/10 font-bold">
                <SelectValue placeholder="Select your level" />
              </SelectTrigger>
              <SelectContent>
                {CLASSES.map(c => <SelectItem key={c} value={c} className="font-bold">{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleComplete} 
            disabled={loading || !studentClass}
            className="w-full h-14 bg-primary font-bold text-lg rounded-2xl kid-card-shadow"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Enter Skybound Academy <ArrowRight className="ml-2" /></>}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
