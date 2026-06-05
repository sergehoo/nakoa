import { NextResponse, type NextRequest } from "next/server";

// Routes protégées par préfixe
const PROTECTED_PREFIXES = ["/dashboard", "/catalog", "/quotes", "/orders", "/account", "/p", "/a"];
const AUTH_ROUTES = ["/login", "/register", "/otp", "/reset", "/two-factor"];

// Cookie miroir posé par stores/auth.ts au moment du login/refresh
const AUTH_COOKIE = "printhub-auth";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const hasAuth = !!req.cookies.get(AUTH_COOKIE)?.value;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
  const isAuthRoute = AUTH_ROUTES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  // 1. Route protégée + pas authentifié → /login?from=<original>
  if (isProtected && !hasAuth) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname + (req.nextUrl.search || ""));
    return NextResponse.redirect(url);
  }

  // 2. Route auth + déjà authentifié → on respecte ?from= (post-login redirect),
  //    sinon on envoie vers le rôle (générique = /dashboard).
  //    Important : ne PAS rediriger si ?from= est présent — le composant
  //    LoginForm gère l'aiguillage role-based et le retour vers `from`.
  if (isAuthRoute && hasAuth) {
    const url = req.nextUrl.clone();
    const from = req.nextUrl.searchParams.get("from");
    // Si on a un from, on laisse passer la page login pour qu'elle gère la redir.
    // Sinon on envoie sur /dashboard générique.
    if (!from) {
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
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
