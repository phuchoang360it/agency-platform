import type { CtaBlock as CTABlockType } from '@/payload-types'

type Props = CTABlockType & {
  className?: string
}

export function CTAComponent({
  heading,
  body,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  variant = 'banner',
  className,
}: Props) {
  const isBanner = variant === 'banner'
  return (
    <section
      className={`px-6 py-20 ${isBanner ? 'bg-primary text-white' : ''} ${className ?? ''}`}
      data-block="cta"
    >
      <div className="max-w-3xl mx-auto text-center">
        <h2 className={`text-3xl font-bold mb-4 ${isBanner ? 'text-white' : 'text-gray-900'}`}>
          {heading}
        </h2>
        {body && (
          <p className={`mb-8 text-lg ${isBanner ? 'text-white/90' : 'text-gray-600'}`}>{body}</p>
        )}
        <div className="flex gap-4 justify-center flex-wrap">
          {primaryLabel && primaryHref && (
            <a
              href={primaryHref}
              className={`px-8 py-3 rounded-tenant font-semibold transition-colors ${
                isBanner
                  ? 'bg-white text-primary hover:bg-white/90'
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              {primaryLabel}
            </a>
          )}
          {secondaryLabel && secondaryHref && (
            <a
              href={secondaryHref}
              className={`px-8 py-3 rounded-tenant font-semibold border transition-colors ${
                isBanner
                  ? 'border-white text-white hover:bg-white/10'
                  : 'border-primary text-primary hover:bg-primary/5'
              }`}
            >
              {secondaryLabel}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
