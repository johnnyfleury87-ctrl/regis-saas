export default function handler(req, res) {
  const envStatus = {
    // Public environment variables (accessible in browser)
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    // Server-only environment variables
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
  };

  const allPublicConfigured =
    envStatus.NEXT_PUBLIC_SUPABASE_URL && envStatus.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const allServerConfigured =
    envStatus.SUPABASE_URL && envStatus.SUPABASE_SERVICE_KEY;

  const status = allPublicConfigured && allServerConfigured ? "ok" : "warning";

  res.status(200).json({
    status,
    timestamp: new Date().toISOString(),
    environment: {
      public: {
        configured: allPublicConfigured,
        variables: {
          NEXT_PUBLIC_SUPABASE_URL: envStatus.NEXT_PUBLIC_SUPABASE_URL,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: envStatus.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
      },
      server: {
        configured: allServerConfigured,
        variables: {
          SUPABASE_URL: envStatus.SUPABASE_URL,
          SUPABASE_SERVICE_KEY: envStatus.SUPABASE_SERVICE_KEY,
        },
      },
    },
  });
}
