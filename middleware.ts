/* ============================================
   Next.js Middleware
   Runs on every request. Refreshes the Supabase
   auth session and protects routes.
   ============================================ */

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

// Run middleware on all routes except static files and images
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|sw.js).*)",
  ],
};
