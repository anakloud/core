import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  base: "/docs",
  server: {
    port: 4001,
  },
  integrations: [
    starlight({
      title: "Anakloud Core",
      description: "Documentation for Anakloud Core services",
      defaultLocale: "root",
      customCss: ["./src/styles/custom.css"],
      expressiveCode: {
        themes: ["github-light", "github-dark"],
      },
      sidebar: [
        {
          label: "Guides",
          autogenerate: { directory: "guides" },
        },
      ],
    }),
  ],
});
