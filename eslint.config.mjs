import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import jsdoc from 'eslint-plugin-jsdoc';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['dist/**', 'coverage/**', 'src/generated/**', 'node_modules/**'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  jsdoc.configs['flat/recommended-typescript'],
  prettier,
  {
    languageOptions: { globals: { ...globals.node, ...globals.jest } },
    rules: {
      'max-lines': ['error', { max: 250, skipBlankLines: true, skipComments: true }],
      'no-inline-comments': 'error',
      'no-console': ['error', { allow: ['error'] }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: true,
          require: { ClassDeclaration: true, FunctionDeclaration: true, MethodDefinition: false },
        },
      ],
      'jsdoc/require-param': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/tag-lines': 'off',
    },
  },
  {
    files: ['test/**/*.ts', '*.mjs', '*.js'],
    rules: { 'jsdoc/require-jsdoc': 'off', 'jsdoc/check-tag-names': 'off' },
  },
);
