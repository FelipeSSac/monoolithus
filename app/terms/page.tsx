import type { Metadata } from "next"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter } from "@/components/site-footer"
import { FieldBand } from "@/components/field-band"

export const metadata: Metadata = {
  title: "Termos de acesso aos dados — Monoolithus",
  description:
    "Como a Monoolithus coleta, usa, armazena e protege os dados dos usuários.",
}

const ATUALIZADO_EM = "22 de junho de 2026"

const secoes = [
  {
    n: "01",
    title: "Quem somos",
    paragraphs: [
      "A Monoolithus é uma software house sediada em São José dos Campos, Brasil, especializada em desenvolvimento web sob medida. Estes termos descrevem como tratamos os dados das pessoas que acessam nosso site e dos sistemas que desenvolvemos.",
      "Para fins da Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018), a Monoolithus atua como controladora dos dados coletados diretamente por este site.",
    ],
  },
  {
    n: "02",
    title: "Dados que coletamos",
    paragraphs: [
      "Coletamos apenas o necessário. Nada de coleta indiscriminada.",
    ],
    list: [
      "Dados de contato que você nos envia voluntariamente (nome, e-mail e mensagem) ao falar conosco.",
      "Dados técnicos de navegação, como endereço IP, tipo de navegador e páginas visitadas, usados de forma agregada.",
      "Dados de uso anônimos coletados por ferramentas de analytics para entender o desempenho do site.",
    ],
  },
  {
    n: "03",
    title: "Como usamos os dados",
    paragraphs: [
      "Usamos os dados coletados para finalidades claras e limitadas:",
    ],
    list: [
      "Responder a contatos e elaborar propostas de projeto.",
      "Operar, manter e melhorar o site e nossos serviços.",
      "Cumprir obrigações legais e regulatórias quando aplicável.",
    ],
  },
  {
    n: "04",
    title: "Base legal",
    paragraphs: [
      "Tratamos dados pessoais com base no consentimento, na execução de contrato (ou de procedimentos preliminares a seu pedido) e no legítimo interesse, sempre respeitando seus direitos e liberdades fundamentais.",
    ],
  },
  {
    n: "05",
    title: "Compartilhamento",
    paragraphs: [
      "Não vendemos dados pessoais. Compartilhamos informações apenas com prestadores de serviço essenciais à operação (como hospedagem e analytics), que tratam os dados em nosso nome e sob obrigações de confidencialidade, ou quando exigido por lei.",
    ],
  },
  {
    n: "06",
    title: "Armazenamento e segurança",
    paragraphs: [
      "Adotamos medidas técnicas e organizacionais razoáveis para proteger os dados contra acesso não autorizado, perda ou alteração. Mantemos os dados apenas pelo tempo necessário às finalidades descritas ou conforme exigido por lei.",
    ],
  },
  {
    n: "07",
    title: "Seus direitos",
    paragraphs: [
      "Conforme a LGPD, você pode, a qualquer momento:",
    ],
    list: [
      "Confirmar a existência de tratamento e acessar seus dados.",
      "Corrigir dados incompletos, inexatos ou desatualizados.",
      "Solicitar a anonimização, o bloqueio ou a eliminação de dados desnecessários.",
      "Revogar o consentimento e solicitar a portabilidade dos dados.",
    ],
  },
  {
    n: "08",
    title: "Como exercer seus direitos",
    paragraphs: [
      "Para exercer qualquer um desses direitos ou tirar dúvidas sobre o tratamento dos seus dados, escreva para contato@monoolithus.com. Respondemos dentro de prazo razoável.",
    ],
  },
  {
    n: "09",
    title: "Alterações",
    paragraphs: [
      "Estes termos podem ser revisados quando nossos serviços ou obrigações legais mudarem. A data de atualização no topo desta página sempre refletirá a versão vigente.",
    ],
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      <FieldBand intensity={0.5}>
        <div className="mx-auto max-w-3xl px-6 py-20 lg:px-16 lg:py-28">
          <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
            Documento legal
          </div>
          <h1 className="text-balance font-serif text-5xl font-light leading-[0.95] tracking-tight sm:text-6xl">
            Termos de acesso aos dados
          </h1>
          <p className="mt-6 max-w-xl text-pretty font-serif text-xl font-light italic leading-relaxed text-muted-foreground">
            Transparência sobre o que coletamos, por que coletamos e o que você
            pode fazer a respeito.
          </p>
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Atualizado em {ATUALIZADO_EM}
          </p>
        </div>
      </FieldBand>

      {/* Faixa sólida: corpo legal */}
      <main className="mx-auto max-w-3xl px-6 py-20 lg:px-16 lg:py-24">
        <div className="border-t border-rule">
          {secoes.map((secao) => (
            <section
              key={secao.n}
              className="grid gap-3 border-b border-rule py-10 md:grid-cols-[64px_1fr] md:gap-8"
            >
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary md:pt-1">
                § {secao.n}
              </div>
              <div>
                <h2 className="font-serif text-2xl font-light tracking-tight">
                  {secao.title}
                </h2>
                {secao.paragraphs.map((p, i) => (
                  <p
                    key={i}
                    className="mt-4 leading-relaxed text-muted-foreground"
                  >
                    {p}
                  </p>
                ))}
                {secao.list && (
                  <ul className="mt-4 space-y-3">
                    {secao.list.map((item, i) => (
                      <li
                        key={i}
                        className="flex gap-3 leading-relaxed text-muted-foreground"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-2.5 h-px w-4 shrink-0 bg-primary"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 border border-rule p-8">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
            Encarregado de dados
          </div>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Dúvidas sobre privacidade ou solicitações relacionadas aos seus
            dados podem ser enviadas para{" "}
            <a
              href="mailto:contato@monoolithus.com"
              className="text-foreground underline decoration-primary underline-offset-4 transition-colors hover:text-primary"
            >
              contato@monoolithus.com
            </a>
            .
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
