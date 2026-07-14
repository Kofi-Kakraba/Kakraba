/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'setgqrkgubqaqpkczqdp.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;