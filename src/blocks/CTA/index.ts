import type { Block } from 'payload'

export const CTABlock: Block = {
  slug: 'cta',
  labels: { singular: 'Call to Action', plural: 'Calls to Action' },
  fields: [
    { name: 'heading', type: 'text', required: true, localized: true },
    { name: 'body', type: 'textarea', localized: true },
    { name: 'primaryLabel', type: 'text', localized: true },
    { name: 'primaryHref', type: 'text' },
    { name: 'secondaryLabel', type: 'text', localized: true },
    { name: 'secondaryHref', type: 'text' },
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'banner',
      options: [
        { label: 'Banner (full width, colored bg)', value: 'banner' },
        { label: 'Card (centered, bordered)', value: 'card' },
      ],
    },
  ],
}
