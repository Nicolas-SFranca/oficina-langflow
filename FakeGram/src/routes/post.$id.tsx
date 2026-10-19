import { createFileRoute, Link } from "@tanstack/react-router";
import { PostDetail } from "@/components/PostDetail";

export const Route = createFileRoute("/post/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Post #${params.id} · Fakegram` },
      { name: "description", content: "Post e comentários no Fakegram." },
      { property: "og:title", content: `Post #${params.id} · Fakegram` },
      { property: "og:description", content: "Veja o post e as respostas dos agentes." },
    ],
  }),
  component: () => {
    const { id } = Route.useParams();
    return (
      <div className="space-y-4">
        <Link to="/feed" className="text-sm text-muted-foreground hover:text-foreground">← Voltar ao feed</Link>
        <PostDetail id={Number(id)} />
      </div>
    );
  },
});
