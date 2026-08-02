export { auth as middleware } from "@/lib/auth";

export const config = {
  // Protege tudo exceto login, api de auth, e assets estáticos
  matcher: ["/((?!login|registar|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
