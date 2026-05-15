import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

/**
 * APT boundary rules — see docs/apt/boundary-map.md and
 * references/architecture-map.json. Rules are warnings (not errors) during
 * the staged Phase A reorg so existing imports keep working; tighten to
 * "error" once the migration completes.
 */
const aptBoundaryRules = {
  "no-restricted-imports": [
    "warn",
    {
      patterns: [
        {
          group: ["@/lib/api", "@/lib/api/*", "@/data", "@/data/*"],
          message:
            "APT boundary: pages/components/ui must not import the data layer directly. Use a service from @/services or a hook from @/hooks/use-api-queries.",
        },
      ],
    },
  ],
};

const aptDomainRules = {
  "no-restricted-imports": [
    "warn",
    {
      paths: [
        { name: "react", message: "APT boundary: domain/* must remain framework-free (no React)." },
        { name: "react-router-dom", message: "APT boundary: domain/* must remain framework-free (no router)." },
      ],
      patterns: [
        { group: ["@/hooks", "@/hooks/*"], message: "APT boundary: domain/* must not depend on hooks." },
        { group: ["@/components", "@/components/*"], message: "APT boundary: domain/* must not depend on UI." },
        {
          group: ["@/lib/api/client", "@/lib/api/mock-data", "@/lib/api/http-client", "@/data/mock", "@/data/mock/*", "@/data/real", "@/data/real/*"],
          message: "APT boundary: domain/* may only depend on @/lib/api/types (the contract).",
        },
      ],
    },
  ],
};

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  // Pages, components, ui must not call the data layer directly
  {
    files: ["src/pages/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    ignores: ["src/components/ui/**"],
    rules: aptBoundaryRules,
  },
  // Domain layer: pure, framework-free, contract-only
  {
    files: ["src/domain/**/*.{ts,tsx}", "src/lib/protocol.ts", "src/lib/blood-marker-engine.ts", "src/lib/adaptive-engine.ts", "src/lib/nutrition-targets.ts", "src/lib/schedule-sync.ts", "src/lib/selectors/**/*.ts"],
    rules: aptDomainRules,
  }
);
