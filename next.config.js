/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com', 'wqwmbqmjoaptacmvokfp.supabase.co', 'vsreviouahdaokxvuzsa.supabase.co'],
  },
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
}

module.exports = nextConfig
