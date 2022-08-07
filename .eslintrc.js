// Inspired by: https://github.com/toshi-toma/eslint-config-airbnb-typescript-prettier/blob/master/index.js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  env: {
    es6: true,
  },
  extends: ['airbnb-base', 'plugin:@typescript-eslint/recommended', 'prettier'],
  plugins: ['import', 'prettier', '@typescript-eslint'],
  rules: {
    // prettier
    'prettier/prettier': ['error'],
    // TypeScript
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/no-object-literal-type-assertion': 'off',
    // v4 changes
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': ['error'],
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': ['error'],
    // custom
    camelcase: 'off',
    'no-underscore-dangle': 'off',
    // import
    'import/prefer-default-export': 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        ts: 'never',
      },
    ],
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts', '.json'],
      },
    },
    'import/extensions': ['.js', '.ts'],
  },
};
