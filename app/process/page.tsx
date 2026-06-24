import type { Metadata } from "next"
import Link from "next/link"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter } from "@/components/site-footer"
import { FieldBand } from "@/components/field-band"
import { Reveal } from "@/components/reveal"

export const metadata: Metadata = {
  title: "Processo — Monoolithus",
  description:
    "Processo claro, prazo respeitado: conversa, escopo claro, engenharia e entrega.",
}

const processo = [
  {
    n: "01",
    title: "Conversa",
    desc: "Entendemos o problema antes de falar de solução. Sem jargão, sem caixa-preta.",
  },
  {
    n: "02",
    title: "Escopo claro",
    desc: "Você sabe o que será feito, em quanto tempo e por quanto. Prazo respeitado.",
  },
  {
    n: "03",
    title: "Engenharia",
    desc: "Fora, monólito limpo. Dentro, engenharia séria. Feito para durar.",
  },
  {
    n: "04",
    title: "Entrega",
    desc: "Um sistema que entra no seu negócio como catalisador, não como decoração.",
  },
]

export default function ProcessPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      <FieldBand intensity={0.82}>
        <div className="mx-auto max-w-6xl px-6 py-24 lg:px-16 lg:py-32">
          <div className="grid gap-12 md:grid-cols-[200px_1fr] md:gap-20">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                § 02 — Processo
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
                Processo claro, prazo respeitado.
              </h1>
            </div>
          </div>
        </div>
      </FieldBand>

      {/* Faixa sólida: etapas do processo */}
      <section className="border-b border-rule bg-background">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-16">
          <Reveal>
            <div className="border-t border-rule">
              {processo.map((item) => (
                <div
                  key={item.n}
                  className="group grid gap-4 border-b border-rule py-7 transition-colors duration-300 hover:bg-secondary/50 md:grid-cols-[80px_220px_1fr] md:gap-10 md:items-baseline"
                >
                  <div className="font-serif text-2xl font-light text-primary transition-transform duration-300 ease-out group-hover:translate-x-1">
                    {item.n}
                  </div>
                  <div className="font-serif text-2xl font-light tracking-tight text-primary">
                    {item.title}
                  </div>
                  <p className="max-w-xl leading-relaxed text-muted-foreground">
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
