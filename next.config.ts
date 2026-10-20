import type { NextConfig } from "next";

// هدرهای امنیتی روی همه مسیرها
// نکته: X-Frame-Options: DENY باعث خطای «Firefox can't open this page»
// در پنل پیش‌نمایش (iframe) می‌شد؛ به همین دلیل از CSP frame-ancestors استفاده شد
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors *" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
