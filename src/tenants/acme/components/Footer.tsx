import type { TenantConfig } from '@/lib/tenant/types'
import { devLinkPrefix } from '@/lib/tenant/devLinkPrefix'

type Props = {
  config: TenantConfig
  locale: string
}

export function Footer({ config, locale }: Props) {
  const year = new Date().getFullYear()
  const prefix = devLinkPrefix(config)

  return (
    <footer className="bg-primary text-white/80">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
          <div>
            <p className="text-white font-bold text-lg mb-1">{config.name}</p>
            <p className="text-sm text-white/60">Trusted by businesses across Europe</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {config.navigation?.map((item) => (
              <a
                key={item.slug}
                href={`${prefix}/${locale}${item.slug ? `/${item.slug}` : ''}`}
                className="text-sm hover:text-white transition-colors"
              >
                {item.label[locale] ?? item.label['en'] ?? item.slug}
              </a>
            ))}
          </nav>
        </div>
        <div className="border-t border-white/10 pt-6 text-sm text-white/40">
          © {year} {config.name}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
