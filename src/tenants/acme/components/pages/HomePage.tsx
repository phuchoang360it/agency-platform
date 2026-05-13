import type { Page, Media } from '@/payload-types'
import type { TenantConfig } from '@/lib/tenant/types'

type Props = {
  page: Page
  config: TenantConfig
  locale: string
}

function imageUrl(img: string | Media | null | undefined): string | null {
  if (!img) return null
  if (typeof img === 'string') return null
  return img.url ?? null
}

export function HomePage({ page, locale }: Props) {
  const hero = page.heroSection
  const features = page.featuresSection
  const cta = page.ctaSection
  const bgUrl = imageUrl(hero?.backgroundImage)

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────── */}
      {hero && (
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          {bgUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center scale-105"
              style={{ backgroundImage: `url(${bgUrl})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/92 via-primary/75 to-secondary/85" />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, white 1.5px, transparent 0)',
              backgroundSize: '28px 28px',
            }}
          />

          <div className="relative z-10 max-w-4xl mx-auto text-center px-6 py-24">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6 text-white/90 text-sm font-medium backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-accent inline-block" />
              {locale === 'de' ? 'Ihr verlässlicher Partner' : 'Your trusted partner'}
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-[1.08] tracking-tight mb-6">
              {hero.heading}
            </h1>
            <div className="w-20 h-1.5 bg-accent mx-auto mb-8 rounded-full" />
            {hero.subheading && (
              <p className="text-xl md:text-2xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
                {hero.subheading}
              </p>
            )}
            {hero.ctaLabel && hero.ctaHref && (
              <div className="flex flex-wrap gap-4 justify-center">
                <a
                  href={hero.ctaHref}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-gray-900 font-bold rounded-full hover:bg-accent/90 hover:scale-105 active:scale-100 transition-all shadow-2xl shadow-accent/25"
                >
                  {hero.ctaLabel}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
                <a
                  href={`/${locale}/about`}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 border border-white/25 text-white font-semibold rounded-full hover:bg-white/20 transition-all backdrop-blur-sm"
                >
                  {locale === 'de' ? 'Über uns' : 'Learn more'}
                </a>
              </div>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 72" fill="white" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <path d="M0,36 C480,72 960,0 1440,36 L1440,72 L0,72 Z" />
            </svg>
          </div>
        </section>
      )}

      {/* ── Stats bar ───────────────────────────────────────────────── */}
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          {[
            { num: '300+', label: locale === 'de' ? 'Kunden' : 'Clients' },
            { num: '18', label: locale === 'de' ? 'Länder' : 'Countries' },
            { num: '120', label: locale === 'de' ? 'Experten' : 'Experts' },
          ].map(({ num, label }) => (
            <div key={label}>
              <p className="text-4xl font-extrabold text-primary tabular-nums">{num}</p>
              <p className="text-sm text-gray-500 font-medium mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
      {features && features.features && features.features.length > 0 && (
        <section className="py-24 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6">
            {features.heading && (
              <div className="text-center mb-16">
                <h2 className="text-4xl font-extrabold text-gray-900 mb-4">{features.heading}</h2>
                <div className="w-12 h-1 bg-accent mx-auto rounded-full" />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.features.map((f, i) => (
                <div
                  key={i}
                  className="group bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent rounded-t-2xl" />
                  {f.icon && (
                    <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center text-2xl mb-5 group-hover:bg-primary/12 transition-colors">
                      {f.icon}
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{f.title}</h3>
                  {f.description && (
                    <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA Banner ──────────────────────────────────────────────── */}
      {cta && cta.heading && (
        <section className="py-24 bg-gradient-to-br from-primary to-secondary relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, white 1.5px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
              {cta.heading}
            </h2>
            {cta.body && (
              <p className="text-lg text-white/75 mb-10 leading-relaxed">{cta.body}</p>
            )}
            <div className="flex flex-wrap gap-4 justify-center">
              {cta.primaryLabel && cta.primaryHref && (
                <a
                  href={cta.primaryHref}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary font-bold rounded-full hover:bg-white/90 hover:scale-105 transition-all shadow-xl"
                >
                  {cta.primaryLabel}
                </a>
              )}
              {cta.secondaryLabel && cta.secondaryHref && (
                <a
                  href={cta.secondaryHref}
                  className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/40 text-white font-semibold rounded-full hover:bg-white/10 transition-all"
                >
                  {cta.secondaryLabel}
                </a>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
