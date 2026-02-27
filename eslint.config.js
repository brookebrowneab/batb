import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        document: 'readonly',
        window: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        URL: 'readonly',
        HTMLElement: 'readonly',
        Event: 'readonly',
        FormData: 'readonly',
        File: 'readonly',
        Blob: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        history: 'readonly',
        location: 'readonly',
        import: 'readonly',
        crypto: 'readonly',
        FileReader: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
      },
    },
  },
  {
    ignores: ['dist/', 'node_modules/'],
  },
];
