const CORES = [
  "bg-azul-700",
  "bg-azul-900",
  "bg-cinza-600",
  "bg-verde-600",
  "bg-azul-500",
];

function corAvatar(nome: string): string {
  const hash = nome.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return CORES[hash % CORES.length];
}

export function iniciaisNome(nome: string): string {
  return nome
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const TAMANHOS = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
} as const;

export function AvatarAtleta({
  nome,
  tamanho = "md",
}: {
  nome: string;
  tamanho?: keyof typeof TAMANHOS;
}) {
  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-full font-semibold text-white select-none ${corAvatar(nome)} ${TAMANHOS[tamanho]}`}
    >
      {iniciaisNome(nome)}
    </div>
  );
}
