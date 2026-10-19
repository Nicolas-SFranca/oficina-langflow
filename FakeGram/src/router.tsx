import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { routeTree } from "./routeTree.gen";

const visto = new Map<string, number>();
const avisar = (e: unknown) => {
  const msg = e instanceof Error ? e.message : "Erro inesperado";
  const agora = Date.now();
  if (agora - (visto.get(msg) ?? 0) < 8000) return;
  visto.set(msg, agora);
  toast.error(msg);
};

export const getRouter = () => {
  const queryClient = new QueryClient({
    queryCache: new QueryCache({ onError: avisar }),
    mutationCache: new MutationCache({ onError: avisar }),
    defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
