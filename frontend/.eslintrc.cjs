module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh'],
  env: { browser: true, es2022: true, node: true },
  parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
  extends: ['eslint:recommended', 'plugin:react-hooks/recommended'],
  ignorePatterns: ['dist/', 'node_modules/', '*.js', '*.d.ts'],
  rules: {
    'no-debugger': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'no-undef': 'off',
    'no-empty': 'off',
    // Legacy pages use stable loader functions declared in component scope.
    // rules-of-hooks stays enabled; dependency cleanup is tracked separately.
    'react-hooks/exhaustive-deps': 'off',
    'react-refresh/only-export-components': 'off',
  },
}
