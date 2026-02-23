// eslint.config.mjs
import js from "@eslint/js";
import globals from "globals";

export default [
  // ignore folders we never lint
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "coverage/**",
      "**/*.min.js",
    ],
  },

  // browser JS files
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module", // change to "module" if you use <script type="module">
      globals: globals.browser,
    },
    rules: {
      ...js.configs.recommended.rules,

      // nice defaults for small projects
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
    },
  },
];