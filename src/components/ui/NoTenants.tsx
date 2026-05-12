import Link from 'next/link'

// Shown at http://localhost:3000 when no tenant config is registered in the registry.
// This should never appear in production (every domain should resolve to a tenant).
export function NoTenantsPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-lg mx-auto px-8 py-16 text-center">
        <div className="text-6xl mb-6">🏗️</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          No tenants configured yet
        </h1>
        <p className="text-gray-600 mb-8">
          This is the 360IT multi-tenant web platform scaffold. Add a tenant to get started.
        </p>
        <div className="bg-gray-100 rounded-lg p-4 text-left font-mono text-sm text-gray-700">
          <p className="mb-1 font-semibold text-gray-900"># Quick start</p>
          <p>pnpm tenant:seed __fixture__</p>
          <p className="mt-2 text-gray-500"># Then preview:</p>
          <p>localhost:3000/tenant/__fixture__.test/en</p>
        </div>
        <div className="mt-8">
          <Link
            href="/admin"
            className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Open Admin →
          </Link>
        </div>
      </div>
    </main>
  )
}
