import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin", "google-auth-library", "jwks-rsa", "jose"],
  async headers() {
    const coop = [{ key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" }];
    return [
      { source: "/login", headers: coop },
      { source: "/teacher", headers: coop },
      { source: "/teacher/:path*", headers: coop },
      { source: "/", headers: coop },
    ];
  },
};

export default nextConfig;
