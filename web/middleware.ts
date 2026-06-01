import { NextResponse, type NextRequest } from "next/server";

// Routes protégées par préfixe
const PROTECTED_PREFIXES = ["/dashboard", "/catalog", "/quotes", "/orders", "/account", "/p", "/a"];
const AUTH_ROUTES = ["/login", "/register", "/otp", "/reset", "/two-factor"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Lit l'auth depuis le storage persist Zustand côté client => cookie miroir optionnel
  // Le client gère la redirection si pas authentifié ; ici on protège contre l'accès direct aux URLs.
  const hasAuth = req.cookies.get("printhub-auth")?.value;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (isProtected && !hasAuth) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && hasAuth) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml
     * - assets in /public
     */
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images|.*\\..*).*)",
  ],
};
