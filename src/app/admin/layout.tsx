import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

const links = [
  { href: "/admin", label: "Documents" },
  { href: "/admin/new", label: "New" },
  { href: "/admin/settings", label: "Signature" },
] as const;

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line bg-canvas/90 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-5xl items-center gap-8 px-6 py-4 text-sm">
          <Link href="/admin">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-6">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-ink-muted transition-colors hover:text-ink">
                {l.label}
              </Link>
            ))}
          </div>
          <form action="/logout" method="post" className="ml-auto">
            <button type="submit" className="btn btn-quiet px-0">
              Log out
            </button>
          </form>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-12">{children}</main>
    </div>
  );
}
