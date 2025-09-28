import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  poweredByHeader: false,
  
  // Enable image optimisation for external domains if needed in future
  images: {
    domains: [],
  },
  
  // Environment variables that should be exposed to the browser
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Webpack configuration for future client-side parsing libraries
  webpack: (config) => {
    // Enable WebAssembly for PDF.js and other parsers
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    
    return config;
  },
};

export default nextConfig;
