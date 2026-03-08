import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  // ----------------------------------------------------------------
  // Base JS
  // ----------------------------------------------------------------
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: { globals: globals.browser },
  },

  // ----------------------------------------------------------------
  // TypeScript
  // ----------------------------------------------------------------
  {
    files: ['**/*.{ts,mts,cts,tsx}'],
    extends: [...tseslint.configs.recommended],
    rules: {
      // Unused vars — underscore prefix to opt out
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Prefer `interface` for object shapes, `type` for unions/intersections
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      // Always use `import type` for type-only imports — smaller bundles
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      // Explicit return types on exported functions — helps readability
      '@typescript-eslint/explicit-module-boundary-types': 'off', // too noisy for React components
      // No explicit `any` — use `unknown` instead
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // ----------------------------------------------------------------
  // React
  // ----------------------------------------------------------------
  pluginReact.configs.flat.recommended,
  {
    plugins: { 'react-hooks': pluginReactHooks },
    settings: {
      react: { version: 'detect' }, // auto-detect React version
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error', // upgrade from warn — missing deps cause bugs
      // Enforce self-closing tags for components without children
      'react/self-closing-comp': 'error',
      // No array index as key — causes subtle re-render bugs
      'react/no-array-index-key': 'warn',
      // Prop types not needed with TypeScript
      'react/prop-types': 'off',
    },
  },

  // ----------------------------------------------------------------
  // Unused imports — auto-removable on save via editor integration
  // ----------------------------------------------------------------
  {
    plugins: { 'unused-imports': unusedImports },
    rules: {
      'unused-imports/no-unused-imports': 'error', // auto-fix removes the import
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },

  // ----------------------------------------------------------------
  // Import sorting — auto-fixable on save
  // ----------------------------------------------------------------
  {
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },

  // ----------------------------------------------------------------
  // General best practices
  // ----------------------------------------------------------------
  {
    rules: {
      // Prefer const — catches accidental let declarations
      'prefer-const': 'error',
      // No console.log in committed code — use your logger
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Consistent equality checks
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      // No var
      'no-var': 'error',
    },
  },

  // ----------------------------------------------------------------
  // Ignore patterns
  // ----------------------------------------------------------------
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '**/*.generated.*',
      'src/generated/**',
      '.ouput/**',
      '.wxt/**',
      'public/**',
    ],
  },
]);
