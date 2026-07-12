/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // This gives Next.js permission to optimize images coming from Supabase
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;