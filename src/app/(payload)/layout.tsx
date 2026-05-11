import type { ReactNode } from 'react'
import '@payloadcms/next/css'

// Payload admin layout — imports Payload's own CSS. No Tailwind globals here.
export default function PayloadLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
