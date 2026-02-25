
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
         Idea/Topic focus: ${input.idea || 'General Knowledge, Science, and History'}.
         
         The 'content' field must be at least 500 words long. Structure it with clear headers:
         1. INTRODUCTION: What is this topic?
         2. TYPES & CATEGORIES: Break it down.
         3. ADVANTAGES & IMPORTANCE: Why does it matter to the world?
         4. FUN FACTS: 3 surprising facts.
         5. SUMMARY: Final wrap-up.
         
         CRITICAL IMAGE RULE: For the imageUrl, you MUST use: 
         https://picsum.photos/seed/{{title}}/800/600 
         Replace {{title}} with a URL-safe version of the lesson title. 
         DO NOT use any other URLs.
         
         Return as JSON.`
      : `Generate ${input.count} fun tasks/missions for children based on this idea: ${input.idea || 'helping at home and learning'}. 
         Examples: "Read 10 pages of a history book", "Identify 3 constellations", "Help clean the living room". 
         Points should be between 20 and 100. 
         Return as JSON.`;

    const { output } = await ai.generate({
      prompt: promptText,
      output: { schema: ContentGeneratorOutputSchema },
    });

    // Post-process to ensure valid image URLs if the AI didn't follow the instruction perfectly
    if (output?.lessons) {
      output.lessons = output.lessons.map(l => ({
        ...l,
        imageUrl: `https://picsum.photos/seed/${encodeURIComponent(l.title)}/800/600`
      }));
    }

    return output!;
  }
);
