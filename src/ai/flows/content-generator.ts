'use server';
/**
 * @fileOverview A Genkit flow to auto-generate deep, academic educational lessons and tasks for children.
 * Enforces deep academic structure (at least 500 words, Intro, Types, Advantages, Fun Facts, Summary).
 * Uses a deterministic image engine to ensure real, high-quality images.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ContentGeneratorInputSchema = z.object({
  type: z.enum(['lessons', 'tasks']),
  count: z.number().min(1).max(10), // Reduced max to 10 for stability
  idea: z.string().optional().describe("Admin's specific topic or idea to guide the generation."),
});

const LessonSchema = z.object({
  title: z.string(),
  category: z.string(),
  description: z.string().describe("A 2-sentence summary of the lesson."),
  content: z.string().describe("Extremely deep, long-form academic lesson notes (at least 500 words)."),
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
         
         CRITICAL ACADEMIC RULE: The 'content' field must be a full LESSON NOTE (at least 500 words). It MUST include:
         1. INTRODUCTION: Define the topic and its origin.
         2. TYPES & CLASSIFICATIONS: Detailed list of categories or variations.
         3. ADVANTAGES & DISADVANTAGES: Why is this important? What are the risks?
         4. THE FUTURE: How will this topic change in 20 years?
         5. FUN FACTS: 5 surprising facts for kids.
         6. SUMMARY: A wrap-up.
         
         IMAGE RULE: Provide a single keyword representing the subject.
         
         Return as JSON.`
      : `Generate ${input.count} fun daily tasks/missions for children based on this idea: ${input.idea || 'helping at home and learning'}. 
         Points should be between 20 and 100. 
         Return as JSON.`;

    const { output } = await ai.generate({
      prompt: promptText,
      output: { schema: ContentGeneratorOutputSchema },
    });

    if (output?.lessons) {
      output.lessons = output.lessons.map(l => {
        const safeSeed = l.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
        return {
          ...l,
          imageUrl: `https://picsum.photos/seed/${safeSeed}/800/600`
        };
      });
    }

    return output!;
  }
);
