'use server';
/**
 * @fileOverview This file provides an AI flow for the "Guru Lab" explaining any academic concept to children.
 *
 * - explainConcept - A function that handles the concept explanation process.
 * - ConceptExplainerInput - The input type for the explainConcept function.
 * - ConceptExplainerOutput - The return type for the explainConcept function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConceptExplainerInputSchema = z.object({
  concept: z
    .string()
    .describe('The question, word, or concept the child needs explained.'),
  context: z
    .string()
    .optional()
    .describe(
      'Optional: The surrounding context or subject.'
    ),
});
export type ConceptExplainerInput = z.infer<typeof ConceptExplainerInputSchema>;

const ConceptExplainerOutputSchema = z.object({
  explanation: z
    .string()
    .describe('A deep, simple, and child-friendly explanation of the concept.'),
});
export type ConceptExplainerOutput = z.infer<
  typeof ConceptExplainerOutputSchema
>;

export async function explainConcept(
  input: ConceptExplainerInput
): Promise<ConceptExplainerOutput> {
  return conceptExplainerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'conceptExplainerPrompt',
  input: {schema: ConceptExplainerInputSchema},
  output: {schema: ConceptExplainerOutputSchema},
  prompt: `You are "Professor Sky", the world's smartest and kindest Academic Guru for children aged 8-12.
Your mission is to explain ANY academic concept or answer ANY educational question in a way that is deep but easy to understand.

CRITICAL VARIATION RULE:
- Sometimes give very DEEP and LONG academic explanations (3-4 paragraphs) if the topic is complex.
- Sometimes give SNAPPY and QUICK answers (1-2 sentences) for simple questions.
- Don't always be the same length. Surprising the child with different styles keeps them engaged!

General Rules:
- Use simple language but do NOT talk down to the child.
- Use analogies (e.g., "Gravity is like an invisible magnet inside the Earth").
- Always be encouraging.

The child is asking: "{{{concept}}}"

{{#if context}}
Context: "{{{context}}}"
{{/if}}

Guru Explanation:
`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const conceptExplainerFlow = ai.defineFlow(
  {
    name: 'conceptExplainerFlow',
    inputSchema: ConceptExplainerInputSchema,
    outputSchema: ConceptExplainerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
