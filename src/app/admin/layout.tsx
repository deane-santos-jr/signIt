import Link from "next/link";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-200 bg-white">
        <nav className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-3 text-sm">
          <Link href="/admin" className="font-semibold tracking-tight">
            signIt
          </Link>
          <Link href="/admin/new" className="text-neutral-600 hover:text-neutral-900">
            New document
          </Link>
          <Link href="/admin/settings" className="text-neutral-600 hover:text-neutral-900">
            Settings
          </Link>
          <form action="/logout" method="post" className="ml-auto">
            <button type="submit" className="text-neutral-500 hover:text-neutral-900">
              Log out
            </button>
          </form>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
