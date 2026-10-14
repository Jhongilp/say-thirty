/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static Site Generation: every route compiles to plain HTML/CSS/JS in `out/`
  // for Firebase Hosting. Switch to `output: 'standalone'` for Cloud Run / App Hosting.
  output: "export",
  images: {
    // The default image optimizer needs a server; static export serves images as-is.
    unoptimized: true,
  },
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
