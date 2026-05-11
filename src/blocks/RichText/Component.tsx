import type { RichTextBlock as RichTextBlockType } from '@/payload-types'

type Props = RichTextBlockType & {
  className?: string
}

const maxWidthClasses: Record<string, string> = {
  prose: 'max-w-prose',
  wide: 'max-w-4xl',
  full: 'max-w-none',
}

export function RichTextComponent({ content, maxWidth = 'prose', className }: Props) {
  // content is a Lexical serialised object. In Phase 1 this renders a placeholder.
  // Phase 2 will wire up @payloadcms/richtext-lexical's React renderer.
  return (
    <section className={`px-6 py-12 ${className ?? ''}`} data-block="rich-text">
      <div className={`mx-auto prose prose-gray ${maxWidthClasses[maxWidth] ?? maxWidthClasses['prose']}`}>
        {content ? (
          <pre className="text-xs text-gray-400">{JSON.stringify(content, null, 2)}</pre>
        ) : (
          <p className="text-gray-400 italic">No content</p>
        )}
      </div>
    </section>
  )
}
