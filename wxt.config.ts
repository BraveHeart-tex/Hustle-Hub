import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { defineConfig } from 'wxt';
import { z } from 'zod';

export const viteEnvSchema = z.object({
  VITE_RELEASE_REVIEWER_USER_ID: z
    .string()
    .regex(/^\d+$/, 'Must be a numeric user ID'),
  VITE_BASE_API_URL: z.url().describe('Base API endpoint URL'),
  VITE_JIRA_BASE_URL: z.url().describe('Jira base URL'),
  VITE_GITLAB_USER_ID: z.string().regex(/^\d+$/, 'Must be a numeric user ID'),
  VITE_DEPLOYMENT_WIDGET_MATCH: z
    .string()
    .min(1)
    .describe('Browser extension match pattern for deployment widget pages')
    .optional(),
  VITE_DEPLOYMENT_WIDGET_PROJECT_PATH: z
    .string()
    .min(1)
    .describe('GitLab project path used by the deployment widget')
    .optional(),
});

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  manifest: {
    permissions: ['tabs', 'scripting', 'storage', 'notifications'],
    action: {},
    name: 'Hustle Hub',
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
