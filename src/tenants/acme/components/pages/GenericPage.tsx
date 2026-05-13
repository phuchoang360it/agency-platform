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

export function GenericPage({ page }: Props) {
  const hero = page.heroSection
  const body = page.bodyContent as { root?: LexicalNode } | null | undefined

  return (
    <>
      {hero && (
        <section className="py-24 bg-gray-50 text-center">
          <div className="max-w-4xl mx-auto px-6">
            <h1 className="text-5xl font-extrabold text-gray-900 mb-4">{hero.heading}</h1>
            {hero.subheading && (
              <p className="text-xl text-gray-500 max-w-2xl mx-auto">{hero.subheading}</p>
            )}
          </div>
        </section>
      )}
      {body?.root && (
        <section className="py-16 bg-white">
          <div className="max-w-3xl mx-auto px-6 prose prose-lg prose-gray">
            {renderLexical(body.root)}
          </div>
        </section>
      )}
    </>
  )
}
