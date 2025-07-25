/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    experimental: {
      serverActions: true, // تأكد من تفعيل Server Actions إذا كنت تستخدمها
      serverComponentsExternalPackages: ['@supabase/supabase-js'], // مهم للـ Server Components و API Routes
    },
  };
  
  export default nextConfig;