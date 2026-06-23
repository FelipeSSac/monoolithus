import Link from "next/link"
import { Slab } from "@/components/slab"

const links = [
  { href: "/#servicos", label: "Serviços" },
  { href: "/#processo", label: "Processo" },
  { href: "/#contato", label: "Contato" },
]

export function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-background/85 backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6 lg:px-16">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.22em]"
        >
          <Slab width={9} />
          <span>
            MON<span className="text-primary">OO</span>LITHUS
          </span>
        </Link>

        <nav className="hidden items-center gap-7 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground sm:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          SJC · BR
        </span>
      </div>
    </header>
  )
}
