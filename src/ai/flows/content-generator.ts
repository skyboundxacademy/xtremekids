
'use server';
/**
 * @fileOverview A professional Genkit flow to generate high-IQ interactive educational lessons.
 * Uses real academic schemes of work for Primary and Secondary classes.
 * Implements "Self-Healing" image logic.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const StepSchema = z.object({
  type: z.enum(['text', 'image', 'poll']),
  content: z.string().describe("Main teaching text for this step."),
  imageUrl: z.string().optional().describe("A keyword for finding a relevant image."),
  poll: z.object({
    question: z.string(),
    options: z.array(z.string()),
    correctAnswer: z.string(),
    explanation: z.string().describe("What Professor Sky says if the student picks the wrong answer.")
  }).optional()
});

const ContentGeneratorInputSchema = z.object({
  title: z.string(),
  subject: z.string(),
  targetClass: z.string(),
  idea: z.string().optional()
});

const ContentGeneratorOutputSchema = z.object({
  description: z.string().describe("2-sentence summary of the academic path."),
  category: z.string(),
  imageUrl: z.string().describe("A main card image keyword."),
  steps: z.array(StepSchema)
});

export async function generateDeepLesson(input: z.infer<typeof ContentGeneratorInputSchema>) {
  return contentGeneratorFlow(input);
}

const contentGeneratorFlow = ai.defineFlow(
  {
    name: 'contentGeneratorFlow',
    inputSchema: ContentGeneratorInputSchema,
    outputSchema: ContentGeneratorOutputSchema,
  },
  async (input) => {
    const promptText = `You are the High-IQ Academic Architect for Skybound Academy. 
         Generate a deep academic lesson for ${input.targetClass} on the subject of ${input.subject}.
         Topic: ${input.title}.
         Specific Focus: ${input.idea || 'Complete academic coverage based on official schemes of work'}.
         
         STRUCTURE:
         Precisely 10 steps.
         - Step 1: Hook the student with a 'Yes/No' poll based on their daily life.
         - Steps 2-8: Deep academic teaching using 'text', 'image' steps, and 'poll' steps to check understanding.
         - Step 9-10: Advanced concepts and Certificate summary.
         
         POLL RULE: Every poll MUST have 3-4 options and a 'Professor Sky' corrective explanation.
         SELF-HEALING IMAGE RULE: For every step with an image, provide a precise keyword (e.g., 'coding-laptop', 'solar-system-diagram').
         
         Return as JSON.`;

    const { output } = await ai.generate({
      prompt: promptText,
      output: { schema: ContentGeneratorOutputSchema },
    });

    if (output) {
      // Self-Healing Logic: Convert keywords into valid Picsum seeds immediately
      output.imageUrl = `https://picsum.photos/seed/${encodeURIComponent(output.imageUrl || input.title)}/800/600`;
      output.steps = output.steps.map(step => {
        if (step.imageUrl && !step.imageUrl.startsWith('http')) {
          step.imageUrl = `https://picsum.photos/seed/${encodeURIComponent(step.imageUrl)}/800/600`;
        }
        return step;
      });
    }

    return output!;
  }
);
