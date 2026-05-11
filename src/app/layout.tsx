import type { ReactNode } from 'react'

// Minimal root layout — provides the <html>/<body> shell.
// Tailwind globals and tenant themes are applied in (frontend)/layout.tsx
// to avoid bleeding into the Payload admin CSS.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
