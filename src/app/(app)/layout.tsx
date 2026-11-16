import Link from "next/link";
import { LogOut } from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { logout } from "../login/actions";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-background focus:px-3 focus:py-2"
      >
        Pular para o conteúdo
      </a>
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
              <Logo />
            </Link>
            <AppNav className="hidden md:block" />
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user.name}</span>
            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm">
                <LogOut aria-hidden="true" />
                Sair
              </Button>
            </form>
          </div>
        </div>
        <AppNav className="overflow-x-auto border-t px-3 py-1.5 md:hidden" />
      </header>
      <main id="conteudo" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        {children}
      </main>
    </>
  );
}
