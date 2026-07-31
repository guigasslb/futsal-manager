export { auth as middleware } from "@/lib/auth";

export const config = {
  // Protege tudo exceto login, api de auth, e assets estáticos
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
