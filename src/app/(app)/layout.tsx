import Link from "next/link";
import { BottomNav, Sidebar } from "@/components/app-nav";
import { DemoNotice } from "@/components/demo-notice";
import { Logo } from "@/components/logo";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  return (
    <div className="flex min-h-dvh">
      <a
        href="#conteudo"
        className="sr-only z-[60] rounded-lg bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Pular para o conteúdo
      </a>
      <Sidebar userName={user.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Celular: só a marca no topo; a navegação fica embaixo, ao alcance do polegar. */}
        <header className="flex h-14 items-center border-b bg-surface px-4 lg:hidden">
          <Link href="/" aria-label="Ponto Neutro, ir para o painel">
            <Logo />
          </Link>
        </header>
        <main id="conteudo" className="mx-auto w-full max-w-[1440px] flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-6">
          {children}
          <DemoNotice />
        </main>
      </div>
      <BottomNav userName={user.name} />
    </div>
  );
}
