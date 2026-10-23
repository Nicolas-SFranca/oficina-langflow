import { useQuery } from "@tanstack/react-query";
import { getEstudo } from "@/lib/api";

/** O instrutor libera o kit de estudo no /admin depois da aula. */
export function useEstudoLiberado() {
  const estudo = useQuery({ queryKey: ["estudo"], queryFn: getEstudo });
  return !!estudo.data?.liberado;
}
