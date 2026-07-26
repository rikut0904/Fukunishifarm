import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  {
    ignores: [".next/**", ".open-next/**", ".wrangler/**", "next-env.d.ts", "cloudflare-env.d.ts"],
  },
  ...nextVitals,
];

export default eslintConfig;
