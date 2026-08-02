import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/auth/LoginForm";
import { Logo } from "@/components/layout/Logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center text-center">
        <Logo size={26} className="mb-1" />
        <CardDescription>Inicia sessão para continuar</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
        <p className="mt-4 text-center text-legenda text-cinza-500">
          Ainda não tens conta?{" "}
          <Link href="/registar" className="font-medium text-laranja-600 underline">
            Criar conta
          </Link>
        </p>
        <p className="mt-2 text-legenda text-cinza-400">
          Esqueceste a password? Pede a um administrador do clube para a repor.
        </p>
      </CardContent>
    </Card>
  );
}
