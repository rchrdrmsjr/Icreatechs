import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

type CookieStore = Awaited<ReturnType<typeof cookies>>;
type CookieStoreInput = CookieStore | Promise<CookieStore>;

export const createClient = (cookieStore: CookieStoreInput) => {
  const cookieStorePromise = Promise.resolve(cookieStore);

  return createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      async getAll() {
        return (await cookieStorePromise).getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            void cookieStorePromise.then((store) =>
              store.set(name, value, options),
            );
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
};
