import Link from "next/link"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter } from "@/components/site-footer"
import { Slab } from "@/components/slab"

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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      {/* HERO */}
      <header className="border-b border-rule">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:px-16 lg:py-32">
          <div className="mb-12 flex flex-wrap gap-x-7 gap-y-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            <span>Software House</span>
            <span>São José dos Campos · BR</span>
            <span className="text-primary">Desenvolvimento web sob medida</span>
          </div>

          <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <h1 className="text-balance font-serif text-6xl font-light leading-[0.92] tracking-tight text-primary sm:text-7xl lg:text-8xl">
                O monolito não se <em className="italic">quebra</em>.
              </h1>
              <p className="mt-9 max-w-md text-pretty font-serif text-xl font-light italic leading-relaxed text-muted-foreground">
                Software também não deveria. Sistemas que não quebram, pensados
                para durar — sem caixa-preta, sem surpresa.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  href="/#contato"
                  className="bg-primary px-6 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Começar um projeto
                </Link>
                <Link
                  href="/#servicos"
                  className="border border-rule px-6 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground transition-colors hover:border-foreground"
                >
                  O que fazemos
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="relative grid aspect-square w-full place-items-center border border-rule">
                <span className="absolute left-3.5 top-3.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                  FIG. 01
                </span>
                <span className="absolute right-3.5 top-3.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                  SLAB · 4:9
                </span>
                <span className="absolute bottom-3.5 left-3.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                  #FFB23F
                </span>
                <span className="absolute bottom-3.5 right-3.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                  v1.1 · ÂMBAR
                </span>
                <Slab className="w-[14.8%]" width={undefined} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* SERVIÇOS */}
      <section id="servicos" className="border-b border-rule">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:px-16">
          <div className="grid gap-12 md:grid-cols-[200px_1fr] md:gap-20">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
              § 01 — Serviços
            </div>
            <div>
              <h2 className="max-w-xl text-balance font-serif text-4xl font-light leading-tight tracking-tight text-primary sm:text-5xl">
                Desenvolvimento web sob medida.
              </h2>
              <p className="mt-6 max-w-xl text-pretty font-serif text-xl font-light italic leading-relaxed text-muted-foreground">
                Para pequenas e médias empresas que precisam de software feito
                sob medida — em qualquer setor.
              </p>

              <div className="mt-14 grid gap-px border border-rule bg-rule sm:grid-cols-2">
                {servicos.map((item) => (
                  <div key={item.n} className="bg-background p-8">
                    <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                      {item.n}
                    </div>
                    <h3 className="mt-4 font-serif text-2xl font-light tracking-tight text-primary">
                      {item.title}
                    </h3>
                    <p className="mt-3 leading-relaxed text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="border-b border-rule">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center lg:px-16">
          <div className="mb-8 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
            A régua
          </div>
          <blockquote className="mx-auto max-w-3xl text-balance font-serif text-3xl font-light italic leading-tight tracking-tight text-primary sm:text-5xl">
            {'"Onde o mercado entrega genérico e descartável, entregamos disciplina aplicada à engenharia."'}
          </blockquote>
        </div>
      </section>

      {/* PROCESSO */}
      <section id="processo" className="border-b border-rule">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:px-16">
          <div className="grid gap-12 md:grid-cols-[200px_1fr] md:gap-20">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
              § 02 — Processo
            </div>
            <div>
              <h2 className="max-w-xl text-balance font-serif text-4xl font-light leading-tight tracking-tight text-primary sm:text-5xl">
                Processo claro, prazo respeitado.
              </h2>

              <div className="mt-14 border-t border-rule">
                {processo.map((item) => (
                  <div
                    key={item.n}
                    className="grid gap-4 border-b border-rule py-7 md:grid-cols-[80px_220px_1fr] md:gap-10 md:items-baseline"
                  >
                    <div className="font-serif text-2xl font-light text-primary">
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
            </div>
          </div>
        </div>
      </section>

      {/* CONTATO */}
      <section id="contato">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:px-16 lg:py-32">
          <div className="grid gap-12 md:grid-cols-[200px_1fr] md:gap-20">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
              § 03 — Contato
            </div>
            <div>
              <h2 className="max-w-2xl text-balance font-serif text-4xl font-light leading-tight tracking-tight text-primary sm:text-6xl">
                Tem um sistema para construir?
              </h2>
              <p className="mt-6 max-w-lg text-pretty font-serif text-xl font-light italic leading-relaxed text-muted-foreground">
                Conte o problema. A gente devolve com escopo, prazo e preço — sem
                buzzword.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <a
                  href="mailto:contato@monoolithus.com"
                  className="bg-primary px-6 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-primary-foreground transition-opacity hover:opacity-90"
                >
                  contato@monoolithus.com
                </a>
                <a
                  href="https://instagram.com/monoolithus"
                  className="border border-rule px-6 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground transition-colors hover:border-foreground"
                >
                  @monoolithus
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
