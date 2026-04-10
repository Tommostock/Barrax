import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // React 19 strict-mode rules — disabled because they produce false positives.
      // set-state-in-effect: fires on useEffect(() => { loadData(); }, [loadData]) —
      //   the standard async data-fetch pattern; all setState calls are async, not cascading.
      // purity: fires on Date.now() / new Date() used for display-only derived values
      //   (days since join, etc.) — these aren't pure computations but are acceptable here.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
    },
  },
]);

export default eslintConfig;
