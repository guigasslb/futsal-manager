import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
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
  if (!session?.user?.id) redirect("/login");

  // Sessão obsoleta → login (não deixar preso no /criar-clube).
  const utilizadorExiste = await prisma.utilizador.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (!utilizadorExiste) redirect("/login");

  const membro = await obterMembroAtual();
  if (membro) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-cinza-50 p-4">
      <Card className="w-full max-w-lg">
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
