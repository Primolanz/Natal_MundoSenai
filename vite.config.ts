// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// The dev-only TanStack source inspector tags every JSX element with
// data-tsd-source; React Three Fiber treats that as a three.js property and
// crashes. Strip it from files that render 3D.
const stripSourceTagsFor3D = {
  name: "strip-tsd-source-r3f",
  enforce: "post" as const,
  transform(code: string, id: string) {
    if (!/\.[jt]sx(\?|$)/.test(id) || !code.includes("data-tsd-source")) return null;
    if (!id.includes("/src/scene/") && !code.includes("@react-three/")) return null;
    return {
      code: code
        .replace(/\s*"data-tsd-source":\s*"[^"]*",?/g, "")
        .replace(/\s+data-tsd-source="[^"]*"/g, ""),
      map: null,
    };
  },
};

export default defineConfig({
  vite: { plugins: [stripSourceTagsFor3D] },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
