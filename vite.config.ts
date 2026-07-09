import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, type Plugin } from "vite";
import morgan from "morgan";

function requestLogger(): Plugin {
  return {
    name: "request-logger",
    configureServer(server) {
      server.middlewares.use(morgan("dev"));
    },
  };
}

export default defineConfig({
  plugins: [tailwindcss(), sveltekit(), requestLogger()],
});
