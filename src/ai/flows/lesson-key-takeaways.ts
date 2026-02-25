'use server';
/**
 * @fileOverview A Genkit flow to summarize key takeaways from a lesson for children.
 *
 * - lessonKeyTakeaways - A function that handles the lesson key takeaways generation process.
 * - LessonKeyTakeawaysInput - The input type for the lessonKeyTakeaways function.
 * - LessonKeyTakeawaysOutput - The return type for the lessonKeyTakeaways function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LessonKeyTakeawaysInputSchema = z.object({
  lessonContent: z.string().describe('The full content of the lesson.'),
});
export type LessonKeyTakeawaysInput = z.infer<typeof LessonKeyTakeawaysInputSchema>;

const LessonKeyTakeawaysOutputSchema = z.object({
  summary: z.string().describe('A child-friendly summary of the key points from the lesson.'),
});
export type LessonKeyTakeawaysOutput = z.infer<typeof LessonKeyTakeawaysOutputSchema>;

export async function lessonKeyTakeaways(input: LessonKeyTakeawaysInput): Promise<LessonKeyTakeawaysOutput> {
  return lessonKeyTakeawaysFlow(input);
}

const prompt = ai.definePrompt({
  name: 'lessonKeyTakeawaysPrompt',
  input: {schema: LessonKeyTakeawaysInputSchema},
  output: {schema: LessonKeyTakeawaysOutputSchema},
  prompt: `You are a friendly and super smart AI assistant designed to help children understand and remember their lessons.
Your task is to read the lesson content provided below and create a short, fun, and easy-to-understand summary of the most important key points.
Imagine you are explaining it to a friend who is 8 years old. Make sure the language is simple and engaging.

Lesson Content:
---
{{{lessonContent}}}
---

Now, here are the super important things we learned today, explained just for you!`,
});

const lessonKeyTakeawaysFlow = ai.defineFlow(
  {
    name: 'lessonKeyTakeawaysFlow',
    inputSchema: LessonKeyTakeawaysInputSchema,
    outputSchema: LessonKeyTakeawaysOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
