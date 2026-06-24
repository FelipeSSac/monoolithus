import type { Metadata } from "next"
import Link from "next/link"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter } from "@/components/site-footer"
import { FieldBand } from "@/components/field-band"
import { Reveal } from "@/components/reveal"

export const metadata: Metadata = {
  title: "Serviços — Monoolithus",
  description:
    "Desenvolvimento web sob medida para pequenas e médias empresas — sistemas internos, portais, landing pages e automações.",
}

const servicos = [
  {
    n: "01",
    title: "Sistemas internos",
    desc: "Ferramentas sob medida para o jeito que sua operação realmente funciona — não o contrário.",
  },
  {
    n: "02",
    title: "Portais e plataformas",
    desc: "Plataformas online para clientes, parceiros ou equipes, prontas para crescer com o negócio.",
  },
  {
    n: "03",
    title: "Landing pages",
    desc: "Páginas rápidas e precisas, construídas para converter sem ruído.",
  },
  {
    n: "04",
    title: "Automações web",
    desc: "Integrações e automações que tiram o trabalho repetitivo das suas mãos.",
  },
]

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      <FieldBand intensity={0.9}>
        <div className="mx-auto max-w-6xl px-6 py-24 lg:px-16 lg:py-32">
          <div className="grid gap-12 md:grid-cols-[200px_1fr] md:gap-20">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                § 01 — Serviços
              </div>
              <Link
                href="/"
                className="mt-4 inline-block font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
              >
                ← Início
              </Link>
            </div>
            <div>
              <h1 className="max-w-xl text-balance font-serif text-4xl font-light leading-tight tracking-tight text-primary sm:text-5xl">
                Desenvolvimento web sob medida.
              </h1>
              <p className="mt-6 max-w-xl text-pretty font-serif text-xl font-light italic leading-relaxed text-muted-foreground">
                Para pequenas e médias empresas que precisam de software feito
                sob medida — em qualquer setor.
              </p>
            </div>
          </div>
        </div>
      </FieldBand>

      {/* Faixa sólida: catálogo de serviços */}
      <section className="border-b border-rule bg-background">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-16">
          <Reveal>
            <div className="grid gap-px border border-rule bg-rule sm:grid-cols-2">
              {servicos.map((item) => (
                <div
                  key={item.n}
                  className="group bg-background p-8 transition-colors duration-300 hover:bg-secondary hover:shadow-[inset_2px_0_0_0_var(--primary)]"
                >
                  <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary transition-transform duration-300 ease-out group-hover:translate-x-0.5">
                    {item.n}
                  </div>
                  <h2 className="mt-4 font-serif text-2xl font-light tracking-tight text-primary">
                    {item.title}
                  </h2>
                  <p className="mt-3 leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
