import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { defineConfig } from 'wxt';
import { z } from 'zod';

export const viteEnvSchema = z.object({
  VITE_RELEASE_REVIEWER_USER_ID: z
    .string()
    .regex(/^\d+$/, 'Must be a numeric user ID'),
  VITE_BASE_API_URL: z.url().describe('Base API endpoint URL'),
});

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  manifest: {
    permissions: ['tabs', 'scripting', 'bookmarks', 'identity', 'storage'],
    action: {},
  },
  vite: () => {
    viteEnvSchema.parse(import.meta.env);
    return {
      plugins: [tailwindcss()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        },
      },
    };
  },
});
