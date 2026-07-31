import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { obterMembroAtual } from "@/lib/permissoes";
import { CriarClubeForm } from "@/components/onboarding/CriarClubeForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function CriarClubePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membro = await obterMembroAtual();
  if (membro) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-cinza-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-titulo-pagina">Cria o teu clube</CardTitle>
          <CardDescription>
            Ainda não pertences a nenhum clube. Cria o teu ecossistema para começar —
            ficas como administrador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CriarClubeForm />
        </CardContent>
      </Card>
    </div>
  );
}
