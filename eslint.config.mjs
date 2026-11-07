import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import reactHooks from "eslint-plugin-react-hooks";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// eslint-plugin-react-hooks v7 ships the React Compiler diagnostic rules
// (immutability, preserve-manual-memoization, set-state-in-effect, refs,
// static-components, purity, …) and eslint-config-next enables them. This
// project does not use the React Compiler (react-compiler/react-compiler is
// off and reactStrictMode is false), so those rules only produce noise and
// flag the standard fetch-on-mount / manual-memoization patterns used
// throughout the app. Disable the entire react-hooks family EXCEPT
// rules-of-hooks, which catches genuine hook-ordering bugs and is kept on.
const reactHooksRulesOff = Object.fromEntries(
  Object.keys(reactHooks.rules)
    .filter((name) => name !== "rules-of-hooks")
    .map((name) => [`react-hooks/${name}`, "off"]),
);

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    // TypeScript rules
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/prefer-as-const": "off",
    "@typescript-eslint/no-unused-disable-directive": "off",

    // React rules — disable the React Compiler diagnostic family (see above),
    // keeping rules-of-hooks enabled.
    ...reactHooksRulesOff,
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",
    "react/prop-types": "off",
    "react-compiler/react-compiler": "off",

    // Next.js rules
    "@next/next/no-img-element": "off",
    "@next/next/no-html-link-for-pages": "off",

    // General JavaScript rules
    "prefer-const": "off",
    "no-unused-vars": "off",
    "no-console": "off",
    "no-debugger": "off",
    "no-empty": "off",
    "no-irregular-whitespace": "off",
    "no-case-declarations": "off",
    "no-fallthrough": "off",
    "no-mixed-spaces-and-tabs": "off",
    "no-redeclare": "off",
    "no-undef": "off",
    "no-unreachable": "off",
    "no-useless-escape": "off",
  },
}, {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "examples/**", "skills"]
}];

export default eslintConfig;
