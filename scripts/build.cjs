/**
 * Production server build script using esbuild
 */
const esbuild = require("esbuild");
const path = require("path");

async function build() {
  try {
    await esbuild.build({
      entryPoints: [path.join(__dirname, "../src/server/server.ts")],
      bundle: true,
      platform: "node",
      target: "node18",
      format: "cjs",
      outfile: path.join(__dirname, "../dist/server/server.cjs"),
      sourcemap: true,
      minify: true,
      external: [
        // Pino uses worker threads for transports - must be external
        "pino",
        "pino-pretty",
        "pino-http",
      ],
      define: {
        "process.env.NODE_ENV": '"production"',
      },
    });
    console.log("Server build complete (production)");
  } catch (error) {
    console.error("Server build failed:", error);
    process.exit(1);
  }
}

build();
