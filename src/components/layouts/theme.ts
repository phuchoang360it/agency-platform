import type { ThemeTokens } from '@/lib/tenant/types'

// Convert a hex colour like #0066cc to the R G B triplet used by Tailwind's opacity modifier.
function hexToRgbTriple(hex: string): string | null {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return null
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `${r} ${g} ${b}`
}

export function buildThemeCssVars(
  theme: ThemeTokens | undefined,
): Record<string, string> {
  if (!theme) return {}
  const vars: Record<string, string> = {}

  if (theme.primaryColor) {
    const rgb = hexToRgbTriple(theme.primaryColor)
    if (rgb) vars['--color-primary'] = rgb
  }
  if (theme.secondaryColor) {
    const rgb = hexToRgbTriple(theme.secondaryColor)
    if (rgb) vars['--color-secondary'] = rgb
  }
  if (theme.accentColor) {
    const rgb = hexToRgbTriple(theme.accentColor)
    if (rgb) vars['--color-accent'] = rgb
  }
  if (theme.fontFamily) {
    vars['--font-sans'] = theme.fontFamily
  }
  if (theme.borderRadius) {
    vars['--border-radius'] = theme.borderRadius
  }
  return vars
}
