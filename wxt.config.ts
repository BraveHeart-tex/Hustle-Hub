import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { defineConfig } from 'wxt';
import { z } from 'zod';

const viteEnvSchema = z.object({
  VITE_RELEASE_REVIEWER_USER_ID: z
    .string()
    .regex(/^\d+$/, 'Must be a numeric user ID'),
  VITE_BASE_API_URL: z.url().describe('Backend origin URL'),
  VITE_JIRA_BASE_URL: z
    .url()
    .describe('Jira base URL used to generate task urls'),
  VITE_GITLAB_USER_ID: z.string().regex(/^\d+$/, 'Must be a numeric user ID'),
  VITE_USE_MOCK_DATA: z.enum(['true', 'false']).optional(),
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
  imports: false,
  manifest: {
    permissions: [
      'tabs',
      'scripting',
      'storage',
      'notifications',
      'nativeMessaging',
    ],
    action: {},
    name: 'Hustle Hub',
  },
  vite: () => {
    const result = viteEnvSchema.safeParse(import.meta.env);

    if (!result.success) {
      console.error('\n ❌ Environment variable validation failed:\n');
      console.error(
        result.error.issues
          .map((issue) => {
            const path = issue.path.join('.') || 'unknown';
            return `  • ${path}: ${issue.message}`;
          })
          .join('\n'),
      );

      process.exit(1);
    }

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
