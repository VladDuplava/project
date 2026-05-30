// eslint.config.js — ESLint flat config (v9+)

const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        // Node.js globals
        require:   'readonly',
        module:    'writable',
        exports:   'writable',
        __dirname: 'readonly',
        __filename: 'readonly',
        process:   'readonly',
        console:   'readonly',
        Buffer:    'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        // Jest globals
        describe:   'readonly',
        it:         'readonly',
        test:       'readonly',
        expect:     'readonly',
        beforeEach: 'readonly',
        afterEach:  'readonly',
        beforeAll:  'readonly',
        afterAll:   'readonly',
        jest:       'readonly',
      },
    },
    rules: {
      // Можливі помилки
      'no-console':        'off',           // дозволяємо console.log у сервері
      'no-unused-vars':    ['warn', { argsIgnorePattern: '^_|next' }],
      'no-undef':          'error',

      // Стиль коду
      'eqeqeq':            ['error', 'always'],  // завжди === замість ==
      'curly':             ['error', 'all'],      // фігурні дужки обов'язкові
      'no-var':            'error',               // тільки let/const
      'prefer-const':      'warn',                // prefer const де можливо
      'no-duplicate-imports': 'error',

      // Пробіли та форматування
      'indent':            ['warn', 2, { SwitchCase: 1 }],
      'semi':              ['warn', 'always'],
      'quotes':            ['warn', 'single', { avoidEscape: true }],
      'comma-dangle':      ['warn', 'always-multiline'],
      'no-trailing-spaces': 'warn',
      'eol-last':          ['warn', 'always'],
      'no-multiple-empty-lines': ['warn', { max: 2 }],
      'space-before-function-paren': ['warn', { anonymous: 'never', named: 'never', asyncArrow: 'always' }],

      // Async/Await
      'no-return-await':   'warn',
      'require-await':     'warn',
    },
  },
  {
    // Ігноруємо папку node_modules та тестові моки
    ignores: ['node_modules/**', 'tests/__mocks__/**'],
  },
];
