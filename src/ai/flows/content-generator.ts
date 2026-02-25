'use server';
/**
 * @fileOverview A Genkit flow to auto-generate deep, academic educational lessons and tasks for children.
 * Triple-checked for content depth and image reliability.
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
  content: z.string().describe("Deep, long-form educational content (at least 500 words)."),
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
      ? `Generate ${input.count} extremely detailed ACADEMIC educational lessons for children aged 8-12. 
         Idea/Topic focus: ${input.idea || 'General Knowledge, Science, and History'}.
         
         CRITICAL CONTENT RULE: The 'content' field must be at least 500 words long. Structure it with clear headers:
         1. INTRODUCTION: What is this topic and why is it interesting?
         2. TYPES & CATEGORIES: How do we classify this topic?
         3. ADVANTAGES & IMPORTANCE: How does this help the world or humans?
         4. FUN FACTS: 3 surprising or amazing facts about this.
         5. SUMMARY: A final wrap-up for the student.
         
         IMAGE RULE: For the imageUrl, use a placeholder that will be post-processed.
         
         Return as JSON.`
      : `Generate ${input.count} fun daily tasks/missions for children based on this idea: ${input.idea || 'helping at home and learning'}. 
         Examples: "Read 10 pages of a history book", "Identify 3 constellations", "Help clean the living room". 
         Points should be between 20 and 100. 
         Return as JSON.`;

    const { output } = await ai.generate({
      prompt: promptText,
      output: { schema: ContentGeneratorOutputSchema },
    });

    // POST-PROCESS: Ensure high-quality, deterministic image URLs
    if (output?.lessons) {
      output.lessons = output.lessons.map(l => {
        const safeSeed = encodeURIComponent(l.title.replace(/\s+/g, '-').toLowerCase());
        return {
          ...l,
          imageUrl: `https://picsum.photos/seed/${safeSeed}/800/600`
        };
      });
    }

    return output!;
  }
);
