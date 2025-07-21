
'use server';

/**
 * @fileOverview A Genkit tool to generate an image from a text prompt.
 */

import { ai } from '../genkit';
import { z } from 'zod';




export const generateImageTool = ai.defineTool(
  {
    name: 'generateImage',
    description: 'Generate an image based on a text prompt',
    inputSchema: z.object({
      prompt: z.string().describe('The text prompt to generate an image from'),
    }),
  },
  async ({ prompt }: { prompt: string }) => {
    const { output } = await ai.generate({
      prompt,
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
