'use server';
/**
 * @fileOverview This file provides an AI flow for explaining concepts to children.
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
    .describe('The word or concept the child needs explained.'),
  context: z
    .string()
    .optional()
    .describe(
      'Optional: The surrounding text or lesson context where the concept appeared.'
    ),
});
export type ConceptExplainerInput = z.infer<typeof ConceptExplainerInputSchema>;

const ConceptExplainerOutputSchema = z.object({
  explanation: z
    .string()
    .describe('A simple, child-friendly explanation of the concept.'),
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
  prompt: `You are a kind and friendly teacher named "Professor Sky" for young children at SkyboundKids Academy.
Your goal is to explain difficult words or concepts in a way that is super easy for a child to understand.
Use simple language, short sentences, and analogies that children can relate to.
Make sure your explanation is engaging and encouraging.

The child wants to understand: "{{{concept}}}"

{{#if context}}
If there's additional context, please use it to make your explanation even better:
Context: "{{{context}}}"
{{/if}}

Explain it as simply as possible:
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
