
'use server';
/**
 * @fileOverview A Genkit flow to auto-generate deep, educational lessons and tasks for children.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ContentGeneratorInputSchema = z.object({
  type: z.enum(['lessons', 'tasks']),
  count: z.number().min(1).max(20),
  idea: z.string().optional().describe("Admin's specific topic or idea to guide the generation."),
});

const LessonSchema = z.object({
  title: z.string(),
  category: z.string(),
  description: z.string().describe("A 2-sentence summary of the lesson."),
  content: z.string().describe("Deep, long-form educational content. Must include sections like '1. Introduction', '2. Types & Categories', '3. Advantages & Importance', '4. Fun Facts', and '5. Summary'."),
  imageUrl: z.string(),
});

const TaskSchema = z.object({
  title: z.string(),
  points: z.number(),
  type: z.enum(['daily', 'weekly']),
});

const ContentGeneratorOutputSchema = z.object({
  lessons: z.array(LessonSchema).optional(),
  tasks: z.array(TaskSchema).optional(),
});

export async function generateBulkContent(input: { type: 'lessons' | 'tasks', count: number, idea?: string }) {
  return contentGeneratorFlow(input);
}

const contentGeneratorFlow = ai.defineFlow(
  {
    name: 'contentGeneratorFlow',
    inputSchema: ContentGeneratorInputSchema,
    outputSchema: ContentGeneratorOutputSchema,
  },
  async (input) => {
    const promptText = input.type === 'lessons' 
      ? `Generate ${input.count} extremely detailed academic educational lessons for children aged 8-12. 
         Idea/Topic focus: ${input.idea || 'Science, History, and Nature'}.
         The 'content' field must be at least 400 words long. Structure it like a real student notebook:
         1. INTRODUCTION: Clear explanation of what the topic is.
         2. TYPES/CATEGORIES: Different kinds of this topic with explanations.
         3. ADVANTAGES: Why is this important or what are the benefits?
         4. FUN FACTS: 3 surprising facts.
         5. SUMMARY: A short closing summary.
         
         IMPORTANT: For the imageUrl, use a real, high-resolution Unsplash photo URL. 
         DO NOT use "..." or placeholders. Use verified Unsplash links like:
         https://images.unsplash.com/photo-1446776811953-b23d57bd21aa (Space)
         https://images.unsplash.com/photo-1441974231531-c6227db76b6e (Nature)
         https://images.unsplash.com/photo-1532094349884-543bc11b234d (Science)
         Pick appropriate ones for the content.
         Return as JSON.`
      : `Generate ${input.count} fun tasks/missions for children based on this idea: ${input.idea || 'helping at home and learning'}. 
         Examples: "Read 10 pages of a history book", "Clean your study desk", "Identify 3 types of leaves in your garden". 
         Points should be between 20 and 100. 
         Return as JSON.`;

    const { output } = await ai.generate({
      prompt: promptText,
      output: { schema: ContentGeneratorOutputSchema },
    });

    return output!;
  }
);
