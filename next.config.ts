import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    // Ensure Unity WebGL files are handled correctly
    config.module.rules.push({
      test: /\.(wasm|data)$/,
      type: "asset/resource",
    });
    return config;
  },
  // Headers for Unity WebGL builds (if needed)
  async headers() {
    return [
      {
        source: "/unity-games/:path*",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
