module.exports = {
  root: true,
  env: { es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  ignorePatterns: ['dist', 'dist-electron', 'release'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  overrides: [
    {
      files: ['app/src/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
      env: { browser: true },
      extends: [
        'plugin:react/recommended',
        'plugin:react/jsx-runtime',
        'plugin:react-hooks/recommended',
      ],
      settings: { react: { version: 'detect' } },
      rules: {
        'react-refresh/only-export-components': [
          'warn',
          { allowConstantExport: true },
        ],
      },
    },
    {
      files: ['electron/**/*.{ts,tsx}', 'electron-env.d.ts'],
      env: { node: true },
    },
  ],
}
