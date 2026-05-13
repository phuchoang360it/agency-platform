import type { Page } from '@/payload-types'
import type { TenantConfig } from '@/lib/tenant/types'

type Props = {
  page: Page
  config: TenantConfig
  locale: string
}

export function ServicesPage({ page, locale: _locale }: Props) {
  const hero = page.heroSection
  const services = page.featuresSection
  const cta = page.ctaSection

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

      {/* ── Services grid ───────────────────────────────────────────── */}
      {services && services.features && services.features.length > 0 && (
        <section className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            {services.heading && (
              <div className="text-center mb-16">
                <h2 className="text-4xl font-extrabold text-gray-900 mb-4">{services.heading}</h2>
                <div className="w-12 h-1 bg-accent mx-auto rounded-full" />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {services.features.map((s, i) => (
                <div
                  key={i}
                  className="group relative bg-white rounded-2xl p-10 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-primary to-accent rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  {s.icon && (
                    <div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center text-3xl mb-6 group-hover:bg-primary/12 transition-colors">
                      {s.icon}
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{s.title}</h3>
                  {s.description && (
                    <p className="text-gray-500 leading-relaxed">{s.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      {cta && cta.heading && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-2xl mx-auto px-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-4">{cta.heading}</h2>
              {cta.body && (
                <p className="text-gray-500 mb-8 leading-relaxed">{cta.body}</p>
              )}
              <div className="flex flex-wrap gap-4 justify-center">
                {cta.primaryLabel && cta.primaryHref && (
                  <a
                    href={cta.primaryHref}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white font-bold rounded-full hover:bg-primary/90 hover:scale-105 transition-all shadow-lg shadow-primary/20"
                  >
                    {cta.primaryLabel}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>
                )}
                {cta.secondaryLabel && cta.secondaryHref && (
                  <a
                    href={cta.secondaryHref}
                    className="inline-flex items-center px-8 py-4 border-2 border-primary text-primary font-semibold rounded-full hover:bg-primary/5 transition-all"
                  >
                    {cta.secondaryLabel}
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
