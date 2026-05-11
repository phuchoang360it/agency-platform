import type { ReactNode } from 'react'
import '@/styles/globals.css'

// Frontend layout: loads Tailwind globals. Kept separate from root layout so
// Payload admin CSS (in the (payload) group) is not affected.
export default function FrontendLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
