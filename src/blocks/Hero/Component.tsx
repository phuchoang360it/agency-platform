import type { HeroBlock as HeroBlockType } from '@/payload-types'

type Props = HeroBlockType & {
  className?: string
}

export function HeroComponent({ heading, subheading, ctaLabel, ctaHref, variant = 'centered', className }: Props) {
  return (
    <section
      className={`relative flex items-center justify-center min-h-[60vh] px-6 py-20 bg-primary/10 ${className ?? ''}`}
      data-block="hero"
      data-variant={variant}
    >
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">{heading}</h1>
        {subheading && <p className="text-xl text-gray-600 mb-8">{subheading}</p>}
        {ctaLabel && ctaHref && (
          <a
            href={ctaHref}
            className="inline-block px-8 py-3 bg-primary text-white rounded-tenant font-semibold hover:bg-primary/90 transition-colors"
          >
            {ctaLabel}
          </a>
        )}
      </div>
    </section>
  )
}
