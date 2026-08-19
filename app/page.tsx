import Link from "next/link"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter } from "@/components/site-footer"
import { Slab } from "@/components/slab"
import { FieldBand } from "@/components/field-band"
import { Reveal } from "@/components/reveal"
import { Parallax } from "@/components/parallax"
import { WHATSAPP_URL } from "@/lib/site"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      {/* HERO */}
      <FieldBand>
        <div className="mx-auto max-w-6xl px-6 py-24 lg:px-16 lg:py-32">
          <div className="mb-12 flex flex-wrap gap-x-7 gap-y-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            <Reveal distance={8}>
              <span>Software House</span>
            </Reveal>
            <Reveal distance={8} delay={60}>
              <span>São José dos Campos · BR</span>
            </Reveal>
            <Reveal distance={8} delay={120}>
              <span className="text-primary">Desenvolvimento web sob medida</span>
            </Reveal>
          </div>

          <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <Reveal variant="mask">
                <h1 className="text-balance font-serif text-6xl font-light leading-[0.92] tracking-tight text-primary sm:text-7xl lg:text-8xl">
                  O monolito não se <em className="italic">quebra</em>.
                </h1>
              </Reveal>
              <Reveal delay={120}>
                <p className="mt-9 max-w-md text-pretty font-serif text-xl font-light italic leading-relaxed text-muted-foreground">
                  Software também não deveria. Sistemas que não quebram, pensados
                  para durar — sem caixa-preta, sem surpresa.
                </p>
              </Reveal>
              <Reveal delay={200}>
                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-primary px-6 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-primary-foreground transition-[transform,opacity] duration-200 ease-out hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0 active:scale-[0.98]"
                  >
                    Começar um projeto
                  </a>
                  <Link
                    href="/services"
                    className="border border-rule px-6 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground transition-[transform,color,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-foreground active:translate-y-0 active:scale-[0.98]"
                  >
                    O que fazemos
                  </Link>
                </div>
              </Reveal>
            </div>

            <Reveal delay={160} className="flex items-center justify-center">
              <Parallax distance={-12} className="w-full">
                <div className="group relative grid aspect-square w-full place-items-center border border-rule transition-colors duration-500 hover:border-primary/40">
                  <Reveal variant="quiet" delay={280}>
                    <span className="absolute left-3.5 top-3.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                      FIG. 01
                    </span>
                  </Reveal>
                  <Reveal variant="quiet" delay={340}>
                    <span className="absolute right-3.5 top-3.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                      SLAB · 4:9
                    </span>
                  </Reveal>
                  <Reveal variant="quiet" delay={400}>
                    <span className="absolute bottom-3.5 left-3.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                      #FFB23F
                    </span>
                  </Reveal>
                  <Reveal variant="quiet" delay={460}>
                    <span className="absolute bottom-3.5 right-3.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                      v1.1 · ÂMBAR
                    </span>
                  </Reveal>
                  <Slab className="w-[14.8%] transition-transform duration-500 ease-out group-hover:scale-110" width={undefined} />
                </div>
              </Parallax>
            </Reveal>
          </div>
        </div>
      </FieldBand>

      {/* MANIFESTO */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center lg:px-16">
          <Reveal variant="quiet">
            <div className="mb-8 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
              A régua
            </div>
          </Reveal>
          <Reveal variant="mask" delay={200}>
            <blockquote className="mx-auto max-w-3xl text-balance font-serif text-3xl font-light italic leading-tight tracking-tight text-primary sm:text-5xl">
              {'"Onde o mercado entrega genérico e descartável, entregamos disciplina aplicada à engenharia."'}
            </blockquote>
          </Reveal>
        </div>
        <Reveal
          variant="rule"
          className="absolute inset-x-0 bottom-0 h-px bg-rule"
        />
      </section>

      <SiteFooter />
    </div>
  )
}
