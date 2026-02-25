"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Save, Trash2, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({ title: "Success!", description: "Content has been saved to the database (simulated)." });
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon" className="rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="text-primary" /> Admin Panel
          </h1>
        </div>
        <Button onClick={handleSave} disabled={loading} className="rounded-xl gap-2 bg-primary">
          <Save className="w-4 h-4" /> {loading ? "Saving..." : "Save Changes"}
        </Button>
      </header>

      <Tabs defaultValue="lessons" className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-2xl p-1 bg-white shadow-sm mb-8 h-12">
          <TabsTrigger value="lessons" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white">Lessons</TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white">Tasks</TabsTrigger>
          <TabsTrigger value="quizzes" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white">Quizzes</TabsTrigger>
        </TabsList>

        <TabsContent value="lessons">
          <div className="grid gap-6">
            <Card className="rounded-3xl border-none shadow-md overflow-hidden">
              <CardHeader className="bg-primary/5 border-b border-primary/10">
                <CardTitle className="text-lg">Add New Lesson</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Lesson Title</label>
                    <Input placeholder="Enter title..." className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Category</label>
                    <Input placeholder="Space, Nature, etc." className="rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Image URL</label>
                  <Input placeholder="https://..." className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Short Description</label>
                  <Input placeholder="Brief overview for the card" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Full Content</label>
                  <Textarea placeholder="The actual lesson body text..." className="rounded-xl min-h-[200px]" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <div className="space-y-4">
            <Button variant="outline" className="w-full border-dashed rounded-2xl py-8 border-2 border-muted-foreground/20 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all">
              <Plus className="mr-2" /> Add New Task
            </Button>
            <Card className="rounded-3xl border-none shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Save className="w-4 h-4 text-slate-400" />
                  </div>
                  <span className="font-bold">Sample Task Title</span>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive rounded-full">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quizzes">
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border-2 border-dashed">
            <p className="text-muted-foreground font-medium">Quiz builder interface coming soon!</p>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}