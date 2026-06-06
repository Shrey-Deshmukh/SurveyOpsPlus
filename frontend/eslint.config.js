// https://docs.expo.dev/guides/using-eslint/
import { defineConfig } from "eslint/config";
import expoConfig from "eslint-config-expo/flat.js";

export default defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "artifacts/*"],
  },
  {
    // Target only your Detox E2E files so these globals don't bleed into your React Native app code
    files: ["tests/e2e/**/*.js", "tests/e2e/**/*.ts"],
    languageOptions: {
      globals: {
        // Detox Globals
        device: "readonly",
        expect: "readonly",
        element: "readonly",
        by: "readonly",
        waitFor: "readonly",
        web: "readonly",

        // Jest Globals (Detox runs on top of Jest)
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        beforeAll: "readonly",
        beforeEach: "readonly",
        afterAll: "readonly",
        afterEach: "readonly",
        jest: "readonly",
      },
    },
  },
]);
