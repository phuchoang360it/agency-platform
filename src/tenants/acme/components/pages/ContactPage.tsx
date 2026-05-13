import type { Page } from '@/payload-types'
import type { TenantConfig } from '@/lib/tenant/types'

type Props = {
  page: Page
  config: TenantConfig
  locale: string
}

function ContactIcon({ type }: { type: 'address' | 'phone' | 'email' | 'hours' }) {
  const icons = {
    address: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    phone: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    email: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    hours: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  }
  return icons[type]
}

export function ContactPage({ page, locale }: Props) {
  const details = page.contactDetails
  const cta = page.ctaSection

  const contactItems = details
    ? [
        details.address ? { type: 'address' as const, value: details.address } : null,
        details.phone ? { type: 'phone' as const, value: details.phone } : null,
        details.email ? { type: 'email' as const, value: details.email } : null,
        details.hours ? { type: 'hours' as const, value: details.hours } : null,
      ].filter(Boolean)
    : []

  return (
    <>
      {/* ── Page header ─────────────────────────────────────────────── */}
      <section className="relative py-20 bg-gray-50 overflow-hidden">
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
            {locale === 'de' ? 'Nehmen Sie Kontakt auf' : 'Get in touch'}
          </p>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            {locale === 'de' ? 'Kontakt' : 'Contact Us'}
          </h1>
          <div className="w-16 h-1.5 bg-accent mx-auto rounded-full" />
        </div>
      </section>

      {/* ── Two-col layout ──────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Contact info */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              {locale === 'de' ? 'Unsere Kontaktdaten' : 'Our Details'}
            </h2>
            <ul className="space-y-6">
              {contactItems.map((item) =>
                item ? (
                  <li key={item.type} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center text-primary">
                      <ContactIcon type={item.type} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                        {item.type === 'address' ? (locale === 'de' ? 'Adresse' : 'Address') :
                         item.type === 'phone' ? (locale === 'de' ? 'Telefon' : 'Phone') :
                         item.type === 'email' ? 'E-Mail' :
                         (locale === 'de' ? 'Öffnungszeiten' : 'Office Hours')}
                      </p>
                      {item.type === 'email' ? (
                        <a href={`mailto:${item.value}`} className="text-primary hover:underline font-medium">
                          {item.value}
                        </a>
                      ) : item.type === 'phone' ? (
                        <a href={`tel:${item.value.replace(/\s/g, '')}`} className="text-gray-700 hover:text-primary font-medium transition-colors">
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-gray-700">{item.value}</p>
                      )}
                    </div>
                  </li>
                ) : null,
              )}
            </ul>
          </div>

          {/* CTA card */}
          {cta && cta.heading && (
            <div className="bg-gradient-to-br from-primary to-secondary rounded-3xl p-10 text-white">
              <h2 className="text-2xl font-bold mb-4">{cta.heading}</h2>
              {cta.body && (
                <p className="text-white/75 mb-8 leading-relaxed">{cta.body}</p>
              )}
              <div className="flex flex-col gap-3">
                {cta.primaryLabel && cta.primaryHref && (
                  <a
                    href={cta.primaryHref}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-primary font-bold rounded-full hover:bg-white/90 transition-all shadow-lg"
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
                    className="inline-flex items-center justify-center px-6 py-3.5 border border-white/30 text-white font-semibold rounded-full hover:bg-white/10 transition-all"
                  >
                    {cta.secondaryLabel}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
