module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  env: { node: true, es2022: true },
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  extends: ['eslint:recommended'],
  ignorePatterns: ['dist/', 'node_modules/', '*.js', '*.d.ts'],
  rules: {
    'no-debugger': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-constant-condition': ['error', { checkLoops: false }],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'no-undef': 'off',
    'no-empty': 'off',
  },
}
