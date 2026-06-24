"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"

import { Slab } from "@/components/slab"
import { WHATSAPP_URL } from "@/lib/site"

const links = [
  { href: "/services", label: "Serviços" },
  { href: "/process", label: "Processo" },
  { href: "/contact", label: "Contato" },
]

export function SiteNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close the menu whenever the route changes.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // While open: lock background scroll and close on Escape.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open])

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
              className="relative transition-colors duration-200 hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 sm:gap-5">
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground lg:inline">
            SJC · BR
          </span>
          {/* Persistent CTA — present on every page and viewport */}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-primary-foreground transition-[transform,opacity] duration-200 ease-out hover:opacity-90 active:scale-95 sm:text-[11px] sm:tracking-[0.14em]"
          >
            <span className="sm:hidden">WhatsApp</span>
            <span className="hidden sm:inline">Falar no WhatsApp</span>
          </a>
          {/* Mobile menu toggle — the nav links live here below 640px */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="-mr-1 inline-flex h-9 w-9 items-center justify-center text-foreground transition-[transform,color] duration-200 ease-out hover:text-primary active:scale-90 sm:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      {open && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-x-0 bottom-0 top-14 z-40 cursor-default bg-background/60 backdrop-blur-sm sm:hidden"
          />
          <nav
            id="mobile-menu"
            aria-label="Navegação principal"
            className="absolute inset-x-0 top-full z-50 border-b border-rule bg-background sm:hidden"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="group flex items-center justify-between border-t border-rule px-6 py-4 font-mono text-xs uppercase tracking-[0.16em] text-foreground transition-colors duration-200 hover:text-primary active:bg-secondary"
              >
                {link.label}
                <span
                  aria-hidden="true"
                  className="text-muted-foreground transition-transform duration-200 ease-out group-hover:translate-x-1 group-hover:text-primary"
                >
                  →
                </span>
              </Link>
            ))}
            <div className="border-t border-rule px-6 py-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              São José dos Campos · BR
            </div>
          </nav>
        </>
      )}
    </header>
  )
}
