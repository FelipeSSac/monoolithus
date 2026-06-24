import type { Metadata } from "next"
import Link from "next/link"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter } from "@/components/site-footer"
import { FieldBand } from "@/components/field-band"
import { WHATSAPP_URL } from "@/lib/site"

export const metadata: Metadata = {
  title: "Contato — Monoolithus",
  description:
    "Tem um sistema para construir? Conte o problema e devolvemos com escopo, prazo e preço.",
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      <FieldBand className="border-b-0" intensity={1.3}>
        <div className="mx-auto max-w-6xl px-6 py-24 lg:px-16 lg:py-32">
          <div className="grid gap-12 md:grid-cols-[200px_1fr] md:gap-20">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                § 03 — Contato
              </div>
              <Link
                href="/"
                className="mt-4 inline-block font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
              >
                ← Início
              </Link>
            </div>
            <div>
              <h1 className="max-w-2xl text-balance font-serif text-4xl font-light leading-tight tracking-tight text-primary sm:text-6xl">
                Tem um sistema para construir?
              </h1>
              <p className="mt-6 max-w-lg text-pretty font-serif text-xl font-light italic leading-relaxed text-muted-foreground">
                Conte o problema. A gente devolve com escopo, prazo e preço — sem
                buzzword.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary px-6 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-primary-foreground transition-[transform,opacity] duration-200 ease-out hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0 active:scale-[0.98]"
                >
                  Falar no WhatsApp
                </a>
                <a
                  href="https://instagram.com/monoolithus"
                  className="border border-rule px-6 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground transition-[transform,color,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-foreground active:translate-y-0 active:scale-[0.98]"
                >
                  @monoolithus
                </a>
              </div>
            </div>
          </div>
        </div>
      </FieldBand>

      <SiteFooter />
    </div>
  )
}
