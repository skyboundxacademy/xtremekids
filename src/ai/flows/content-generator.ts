
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
  content: z.string().describe("Deep, long-form educational content. Must include sections like 'Introduction', 'Types', 'Advantages', and 'Summary'."),
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
      ? `Generate ${input.count} extremely detailed educational lessons for children aged 8-12. 
         Idea/Topic focus: ${input.idea || 'General Science, Nature, and History'}.
         The 'content' field must be long (at least 300 words) and structured like a real school note. 
         Include: 1. Introduction, 2. Types/Categories of the topic, 3. Advantages or Importance, 4. Fun Facts, 5. Summary.
         Use simple but academic language.
         For each, provide a realistic imageUrl from Unsplash (https://images.unsplash.com/photo-...) that actually relates to the topic.
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
