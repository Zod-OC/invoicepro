import next from 'eslint-config-next';

export default [
  ...next,
  {
    rules: {
      // Disabled: pre-existing technical debt from before CI was added
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-this-alias": "off",
      "react/no-unescaped-entities": "off",
    },
    ignores: [
      "dist/**",
      ".next/**",
      "node_modules/**",
      "out/**",
    ],
  },
];
