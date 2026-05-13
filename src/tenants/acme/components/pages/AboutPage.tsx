import type { Page } from '@/payload-types'
import type { TenantConfig } from '@/lib/tenant/types'

type Props = {
  page: Page
  config: TenantConfig
  locale: string
}

type LexicalNode = {
  type: string
  text?: string
  children?: LexicalNode[]
  version?: number
  format?: string | number
  [key: string]: unknown
}

function renderLexical(node: LexicalNode): React.ReactNode {
  if (node.type === 'root') {
    return node.children?.map((child, i) => renderLexical({ ...child, _key: i }))
  }
  if (node.type === 'paragraph') {
    const key = (node as { _key?: number })._key ?? Math.random()
    return (
      <p key={key} className="mb-5 leading-relaxed text-gray-600">
        {node.children?.map((child, i) => renderLexical({ ...child, _key: i }))}
      </p>
    )
  }
  if (node.type === 'text') {
    const key = (node as { _key?: number })._key ?? Math.random()
    return <span key={key}>{node.text}</span>
  }
  return null
}

export function AboutPage({ page, locale }: Props) {
  const hero = page.heroSection
  const body = page.bodyContent as { root?: LexicalNode } | null | undefined

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────── */}
      {hero && (
        <section className="relative py-28 bg-gray-50 overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, #1e40af 1.5px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary to-accent" />
          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
            <p className="text-sm font-semibold text-primary/70 uppercase tracking-widest mb-4">
              {locale === 'de' ? 'Wer wir sind' : 'Who we are'}
            </p>
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              {hero.heading}
            </h1>
            <div className="w-16 h-1.5 bg-accent mx-auto mb-8 rounded-full" />
            {hero.subheading && (
              <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
                {hero.subheading}
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100 py-12">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          {[
            { num: '2005', label: locale === 'de' ? 'Gegründet' : 'Founded' },
            { num: '300+', label: locale === 'de' ? 'Kunden' : 'Clients' },
            { num: '120', label: locale === 'de' ? 'Experten' : 'Experts' },
          ].map(({ num, label }) => (
            <div key={label}>
              <p className="text-4xl font-extrabold text-primary tabular-nums">{num}</p>
              <p className="text-sm text-gray-500 font-medium mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Body content ────────────────────────────────────────────── */}
      {body?.root && (
        <section className="py-24 bg-white">
          <div className="max-w-3xl mx-auto px-6">
            <article className="prose prose-lg prose-gray max-w-none text-gray-600 leading-relaxed">
              {renderLexical(body.root)}
            </article>
          </div>
        </section>
      )}
    </>
  )
}
