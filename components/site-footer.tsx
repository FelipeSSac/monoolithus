import Link from "next/link"
import { Slab } from "@/components/slab"

export function SiteFooter() {
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:px-16">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <h4 className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
              Marca
            </h4>
            <p className="font-serif text-xl leading-snug">Monoolithus</p>
            <p className="font-serif text-xl leading-snug text-muted-foreground">
              Desenvolvimento web sob medida
            </p>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              São José dos Campos · BR
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
              Contato
            </h4>
            <a
              href="https://instagram.com/monoolithus"
              className="block font-serif text-xl leading-snug transition-colors hover:text-primary"
            >
              @monoolithus
            </a>
            <a
              href="mailto:contato@monoolithus.com"
              className="block font-serif text-xl leading-snug transition-colors hover:text-primary"
            >
              contato@monoolithus.com
            </a>
          </div>

          <div>
            <h4 className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
              Legal
            </h4>
            <Link
              href="/terms"
              className="block font-serif text-xl leading-snug transition-colors hover:text-primary"
            >
              Termos de acesso aos dados
            </Link>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-rule pt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2.5">
            <Slab width={7} />
            Monoolithus
          </span>
          <span>© {new Date().getFullYear()} · SJC / BR</span>
          <span>O monolito não se quebra.</span>
        </div>
      </div>
    </footer>
  )
}
