import tseslint from 'typescript-eslint';
import framework from './lint/framework-rules.mjs';

const frameworkSources = [
  'decorator/**/*.ts',
  'pages/**/*.ts',
  'actionsComponents/**/*.ts',
  'fixtures/**/*.ts',
  'api/**/*.ts',
  'constants/**/*.ts',
  'reporting/**/*.ts',
  'user/**/*.ts',
  'tests/**/*.ts',
];

export default tseslint.config(
  {
    ignores: ['node_modules/**', 'test-results/**', 'playwright-report/**', 'allure-results/**', 'allure-report/**', 'site/**'],
  },
  {
    files: frameworkSources,
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { '@typescript-eslint': tseslint.plugin, framework },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      'framework/no-comments': 'error',
      'framework/no-hard-wait': 'error',
      'framework/no-hardcoded-credentials': 'error',
      'framework/no-hardcoded-messages': 'error',
    },
  },
  {
    files: ['tests/**/*.spec.ts'],
    rules: {
      'framework/spec-imports-fixtures': 'error',
      'framework/spec-test-metadata': 'error',
      'framework/spec-single-verification': 'error',
      'framework/spec-actions-only': 'error',
      'framework/spec-login-policy': 'error',
    },
  },
  {
    files: ['pages/**/*.ts'],
    rules: { 'framework/page-locators-only': 'error' },
  },
  {
    files: ['actionsComponents/**/*.ts'],
    rules: { 'framework/actions-step-required': 'error' },
  },
  {
    files: ['decorator/**/*.ts'],
    rules: { 'framework/decorator-assertions': 'error' },
  },
  {
    files: ['api/**/*Api.ts'],
    rules: { 'framework/api-endpoint-enum': 'error' },
  },
);
