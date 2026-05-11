import type { SupportedLocale } from '@/lib/tenant/types'

export const SUPPORTED_LOCALES: readonly SupportedLocale[] = ['de', 'en', 'vi']

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  de: 'Deutsch',
  en: 'English',
  vi: 'Tiếng Việt',
}

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return SUPPORTED_LOCALES.includes(value as SupportedLocale)
}
