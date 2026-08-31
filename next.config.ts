import type {NextConfig} from 'next';

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-XSS-Protection', value: '0' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  { key: 'Content-Security-Policy', value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://challenges.cloudflare.com",
    "img-src 'self' https://images.unsplash.com https://picsum.photos https://*.supabase.co data: blob:",
    "font-src 'self'",
    "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://challenges.cloudflare.com",
    "connect-src 'self' data: https://*.supabase.co https://api.razorpay.com https://checkout.razorpay.com https://challenges.cloudflare.com",
    "frame-ancestors 'none'",
  ].join('; ') },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin the workspace root to this project - a stray package-lock.json in
  // C:\Users\Aryan makes Next infer the wrong root otherwise.
  outputFileTracingRoot: __dirname,
  typescript: {
    ignoreBuildErrors: false,
  },
  // Turbopack disabled - using webpack dev server.
  // The webpack watcher reacts to ANY file change under the project root,
  // including test artifacts (e.g. .playwright-mcp/). Each such change
  // triggers a full Fast Refresh rebuild (~seconds), during which RSC
  // navigation requests fail with 500 -> "Unexpected end of JSON input"
  // in the browser. Ignore non-source paths so dev stays fast and stable.
  webpack(config, { dev }) {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/.next/**',
          '**/.git/**',
          '**/.playwright-mcp/**',
          '**/*.tsbuildinfo',
        ],
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  output: 'standalone',
  transpilePackages: ['motion'],
  headers: async () => [
    {
      source: '/(.*)',
      headers: securityHeaders,
    },
  ],
};

export default nextConfig;
