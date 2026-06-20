import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},

  // Override to add webpack config for onnxruntime-web WASM files
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent onnxruntime-node from being bundled in browser
      config.resolve.alias = {
        ...config.resolve.alias,
        sharp$: false,
        "onnxruntime-node$": false,
        "onnxruntime-web/wasm": "onnxruntime-web/dist/ort-wasm.wasm",
      };
    }
    return config;
  },
};

export default nextConfig;
