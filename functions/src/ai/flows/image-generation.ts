
'use server';

/**
 * @fileOverview A flow for generating images from a text prompt.
 */

import { ai } from '../genkit';
import { z } from 'zod';

const ImageGenerationInputSchema = z.object({
  prompt: z.string().describe('A text description of the image to generate.'),
});
export type ImageGenerationInput = z.infer<typeof ImageGenerationInputSchema>;

const ImageGenerationOutputSchema = z.object({
  imageUrl: z
    .string()
    .describe('The generated image as a data URI.'),
});
export type ImageGenerationOutput = z.infer<
  typeof ImageGenerationOutputSchema
>;

export async function generateImage(
  input: ImageGenerationInput
): Promise<ImageGenerationOutput> {
  return imageGenerationFlow(input);
}

const imageGenerationFlow = ai.defineFlow(
  {
    name: 'imageGenerationFlow',
    inputSchema: ImageGenerationInputSchema,
    outputSchema: ImageGenerationOutputSchema,
  },
  async (input: any) => {
    const { output } = await ai.generate({
      prompt: input.prompt,
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
      },
    });

    if (!output) {
      throw new Error('Image generation failed.');
    }

    return {
      imageUrl: output.media?.url || 'No image generated',
    };
  }
);
