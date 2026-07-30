/* eslint-disable import/no-commonjs */
module.exports = {
  root: true,
  env: { browser: true, node: true, es2022: true, jest: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: null,
    tsconfigRootDir: __dirname,
  },
  extends: ['next/core-web-vitals', 'plugin:@typescript-eslint/recommended'],
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-var-requires': 'off',
  },
  settings: { next: { rootDir: ['./'] } },
  overrides: [
    {
      files: ['src/components/promats/**/*', 'src/app/**/(promats)/**/*', 'src/app/**/arama/**/*'],
      rules: {
        // Legacy markup birebir parite — orijinal <img> yapısı korunur
        '@next/next/no-img-element': 'off',
      },
    },
  ],
};
