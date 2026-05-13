import type { TenantConfig } from '@/lib/tenant/types'
import type { Page } from '@/payload-types'

export function renderFixturePage(page: Page, config: TenantConfig, locale: string) {
  return (
    <div className="p-8 font-mono text-sm bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 p-3 bg-amber-100 border border-amber-300 rounded text-amber-800 text-xs">
          Fixture tenant — dev/testing only
        </div>
        <h1 className="text-2xl font-bold mb-2">{page.title}</h1>
        <p className="text-gray-500 text-xs mb-6">
          tenant: {config.slug} | locale: {locale} | template: {page.pageTemplate ?? '(none)'}
        </p>
        {page.heroSection?.heading && (
          <section className="mb-6 p-4 bg-white border rounded">
            <h2 className="font-semibold mb-1">{page.heroSection.heading}</h2>
            {page.heroSection.subheading && (
              <p className="text-gray-600 text-sm">{page.heroSection.subheading}</p>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
