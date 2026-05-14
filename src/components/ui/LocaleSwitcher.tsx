import type { TenantConfig } from '@/lib/tenant/types'
import { devLinkPrefix } from '@/lib/tenant/devLinkPrefix'

type Props = {
  config: TenantConfig
  locale: string
  currentSlug?: string
  className?: string
  activeClassName?: string
  inactiveClassName?: string
}

export function LocaleSwitcher({
  config,
  locale,
  currentSlug = '',
  className = '',
  activeClassName = 'bg-primary text-white',
  inactiveClassName = 'text-gray-400 hover:text-primary hover:bg-primary/5',
}: Props) {
  const prefix = devLinkPrefix(config)
  return (
    <>
      {config.locales.enabled.map((loc) => (
        <a
          key={loc}
          href={`${prefix}/${loc}${currentSlug ? `/${currentSlug}` : ''}`}
          className={`${className} ${loc === locale ? activeClassName : inactiveClassName}`}
        >
          {loc}
        </a>
      ))}
    </>
  )
}
