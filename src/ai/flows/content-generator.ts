
'use server';
/**
 * @fileOverview A Genkit flow to auto-generate educational lessons and tasks for children.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ContentGeneratorInputSchema = z.object({
  type: z.enum(['lessons', 'tasks']),
  count: z.number().min(1).max(20),
});

const LessonSchema = z.object({
  title: z.string(),
  category: z.string(),
  description: z.string(),
  content: z.string(),
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

export async function generateBulkContent(input: { type: 'lessons' | 'tasks', count: number }) {
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
      ? `Generate ${input.count} educational lessons for children aged 8-12. 
         Categories: Space, Science, Nature, History, Technology. 
         Use simple, exciting language. 
         For each, provide an imageUrl from Unsplash (e.g., https://images.unsplash.com/photo-...) related to the topic.
         Return as JSON.`
      : `Generate ${input.count} fun daily tasks for children to earn stars. 
         Examples: "Read 5 pages of a book", "Help with chores", "Draw a planet". 
         Points should be between 10 and 50. 
         Return as JSON.`;

    const { output } = await ai.generate({
      prompt: promptText,
      output: { schema: ContentGeneratorOutputSchema },
    });

    return output!;
  }
);
