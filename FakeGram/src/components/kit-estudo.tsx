import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useEstudoLiberado } from "@/hooks/use-estudo";
import { baixarKitEstudo } from "@/lib/api";
import { cn } from "@/lib/utils";

type Props = { rotulo?: string; destaque?: boolean };

export function BotaoKitEstudo({ rotulo = "Baixar kit de estudo", destaque = false }: Props) {
  const liberado = useEstudoLiberado();
  const [baixando, setBaixando] = useState(false);
  return (
    <button
      type="button"
      disabled={!liberado || baixando}
      title={liberado ? undefined : "O instrutor libera depois da aula"}
      onClick={async () => {
        setBaixando(true);
        try {
          await baixarKitEstudo();
        } catch (erro) {
          toast.error((erro as Error).message);
        }
        setBaixando(false);
      }}
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50",
        destaque
          ? "bg-primary font-medium text-primary-foreground hover:glow"
          : "border hover:bg-secondary",
      )}
    >
      <Download className="h-4 w-4" />
      {baixando ? "Baixando…" : liberado ? rotulo : "Kit de estudo: liberado depois da aula"}
    </button>
  );
}
