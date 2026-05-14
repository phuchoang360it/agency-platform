import type { ReactNode } from 'react'

// Root layout is a passthrough — each route group owns its own <html>/<body>.
// (frontend)/layout.tsx handles frontend; Payload admin uses @payloadcms/next/layouts RootLayout.
// Nesting <html> elements here causes hydration mismatches with Payload's RootLayout.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children as React.ReactElement
}
