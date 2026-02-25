'use server';
/**
 * @fileOverview An AI agent that generates personalized encouraging messages or fun facts for children.
 *
 * - generateEncouragement - A function that handles the generation of encouragement.
 * - AIEncouragementInput - The input type for the generateEncouragement function.
 * - AIEncouragementOutput - The return type for the generateEncouragement function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AIEncouragementInputSchema = z.object({
  childName: z.string().describe("The name of the child to personalize the message."),
  contentType: z.enum(['lesson', 'quiz']).describe("The type of content the child completed (lesson or quiz)."),
  contentTitle: z.string().describe("The title of the completed lesson or quiz."),
  quizScore: z.number().optional().describe("The child's score if a quiz was completed."),
  quizTotalQuestions: z.number().optional().describe("The total number of questions if a quiz was completed.")
});
export type AIEncouragementInput = z.infer<typeof AIEncouragementInputSchema>;

const AIEncouragementOutputSchema = z.object({
  message: z.string().describe("A personalized, encouraging message or a fun, relevant fact.")
});
export type AIEncouragementOutput = z.infer<typeof AIEncouragementOutputSchema>;

export async function generateEncouragement(input: AIEncouragementInput): Promise<AIEncouragementOutput> {
  return aiEncouragementFlow(input);
}

const encouragementPrompt = ai.definePrompt({
  name: 'encouragementPrompt',
  input: { schema: AIEncouragementInputSchema },
  output: { schema: AIEncouragementOutputSchema },
  prompt: `You are a friendly, enthusiastic, and encouraging AI assistant for SkyboundKids Academy. Your goal is to celebrate children's achievements and motivate them to continue learning.

A child named {{{childName}}} just completed the {{{contentType}}} titled '{{{contentTitle}}}'.

{{#if quizScore}}
They scored {{{quizScore}}} out of {{{quizTotalQuestions}}} on the quiz! That's amazing!
{{/if}}

Create a short, personalized message for them. The message should be:
- Very encouraging and positive.
- Use simple, kid-friendly language.
- Celebrate their achievement.
- Optionally, include a fun, interesting fact related to the content they just completed, if relevant and appropriate for a child.
- Keep it concise, around 1-2 sentences.

Here are some examples:
- "Wow, {{{childName}}}! You finished the 'Planets in Space' lesson! You're a super space explorer! Did you know a day on Venus is longer than its year? Keep up the great work!"
- "Fantastic job, {{{childName}}}! You rocked the 'Ocean Animals' quiz! Your brain is full of amazing ocean facts! Did you know the blue whale is the largest animal on Earth? So cool!"
- "Hooray, {{{childName}}}! You completed 'The Life Cycle of a Butterfly' lesson! Your learning journey is taking flight! Did you know butterflies taste with their feet? Amazing!"

Generate the message now:`
});

const aiEncouragementFlow = ai.defineFlow(
  {
    name: 'aiEncouragementFlow',
    inputSchema: AIEncouragementInputSchema,
    outputSchema: AIEncouragementOutputSchema,
  },
  async (input) => {
    const { output } = await encouragementPrompt(input);
    return output!;
  }
);
