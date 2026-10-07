import type { NextConfig } from "next";

const config: NextConfig = {
  output: "export",
  poweredByHeader: false,
  images: { unoptimized: true },
  webpack(configuration, { dev }) {
    if (!dev && Array.isArray(configuration.optimization?.minimizer)) {
      configuration.optimization.minimizer = configuration.optimization.minimizer.filter((plugin: unknown) => plugin === "..." || typeof plugin !== "object" || plugin === null || plugin.constructor?.name !== "CssMinimizerPlugin");
    }
    return configuration;
  },
};
export default config;
