import type { FeatureGridBlock as FeatureGridBlockType } from '@/payload-types'

type Props = FeatureGridBlockType & {
  className?: string
}

const colClasses: Record<string, string> = {
  '2': 'grid-cols-1 sm:grid-cols-2',
  '3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  '4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}

export function FeatureGridComponent({ heading, features, columns = '3', className }: Props) {
  return (
    <section className={`px-6 py-20 ${className ?? ''}`} data-block="feature-grid">
      <div className="max-w-6xl mx-auto">
        {heading && (
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">{heading}</h2>
        )}
        <div className={`grid gap-8 ${colClasses[columns] ?? colClasses['3']}`}>
          {features?.map((feature, i) => (
            <div key={i} className="flex flex-col gap-2 p-6 border border-gray-200 rounded-tenant">
              {feature.icon && <span className="text-2xl">{feature.icon}</span>}
              <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
              {feature.description && (
                <p className="text-gray-600 text-sm">{feature.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
