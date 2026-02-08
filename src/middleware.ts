import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware pour protéger les routes selon les rôles utilisateur
 * NOTES:
 * - Routes publiques : /login, /signup, /
 * - Routes utilisateur : /scanner, /inventory
 * - Routes admin : /admin
 * 
 * La vérification complète du rôle se fait côté client avec le contexte Auth.
 * Ce middleware effectue une vérification simple basée sur la présence du token.
 */

const publicRoutes = ["/", "/login", "/signup"];
const protectedRoutes = ["/scanner", "/inventory", "/admin"];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Route publique - laisser passer
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Vérifier si c'est une route protégée
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Vérifier la présence d'un token dans les cookies
    const token = request.cookies.get("sb-auth-token")?.value ||
                 request.cookies.get("sb-token")?.value;

    // Pas de token - rediriger vers login
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Matcher pour les routes à protéger
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.webp).*)",
  ],
};
