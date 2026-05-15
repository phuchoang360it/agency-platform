import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import type { Payload, Where } from 'payload'
import type { TenantConfig } from '@/lib/tenant/types'

const PLACEHOLDER = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../asset/placholder/image-placeholder-large.jpg',
)

// ── Upsert helpers ────────────────────────────────────────────────────────────

async function upsertTenant(payload: Payload, config: TenantConfig): Promise<string> {
  const existing = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: config.slug } },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    const updated = await payload.update({
      collection: 'tenants',
      id: existing.docs[0].id,
      data: {
        name: config.name,
        slug: config.slug,
        domains: config.domains.map((domain) => ({ domain })),
        active: true,
      },
    })
    return String(updated.id)
  }

  const created = await payload.create({
    collection: 'tenants',
    data: {
      name: config.name,
      slug: config.slug,
      domains: config.domains.map((domain) => ({ domain })),
      active: true,
    },
  })
  return String(created.id)
}

async function upsertPage(
  payload: Payload,
  tenantId: string,
  slugStr: string,
  locale: 'en' | 'de',
  data: Record<string, unknown>,
) {
  const existing = await payload.find({
    collection: 'pages',
    where: {
      and: [
        { slug: { equals: slugStr } },
        { tenant: { equals: tenantId } },
      ],
    },
    locale,
    limit: 1,
  })

  if (existing.docs.length > 0) {
    await payload.update({ collection: 'pages', id: existing.docs[0].id, data, locale })
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await payload.create({ collection: 'pages', data: data as any, locale, draft: false })
  }
}

// ── Media folder seeding ──────────────────────────────────────────────────────

async function upsertMediaFolder(payload: Payload, tenantId: string, name: string, parentId?: string): Promise<string> {
  const where: Where = parentId
    ? { and: [{ name: { equals: name } }, { parent: { equals: parentId } }, { tenant: { equals: tenantId } }] }
    : { and: [{ name: { equals: name } }, { parent: { exists: false } }, { tenant: { equals: tenantId } }] }
  const existing = await payload.find({ collection: 'media-folders', where, limit: 1 })
  if (existing.docs.length > 0) {
    await payload.update({
      collection: 'media-folders',
      id: existing.docs[0].id,
      data: { name, tenant: Number(tenantId), ...(parentId ? { parent: Number(parentId) } : {}) },
    })
    return String(existing.docs[0].id)
  }
  const created = await payload.create({
    collection: 'media-folders',
    data: { name, tenant: Number(tenantId), ...(parentId ? { parent: Number(parentId) } : {}) },
  })
  return String(created.id)
}

// ── Media seeding ─────────────────────────────────────────────────────────────

async function seedMedia(
  payload: Payload,
  tenantId: string,
  folderId: string,
  items: Array<{ alt: string; filename: string }>,
): Promise<string[]> {
  const ids: string[] = []

  let buffer: Buffer
  try {
    buffer = readFileSync(PLACEHOLDER)
  } catch (err) {
    payload.logger.warn(`Placeholder image not found, media seed skipped: ${String(err)}`)
    return ids
  }

  for (const item of items) {
    try {
      const created = await payload.create({
        collection: 'media',
        data: { alt: item.alt, tenant: Number(tenantId), folder: Number(folderId) },
        file: {
          data: buffer,
          mimetype: 'image/jpeg',
          name: item.filename,
          size: buffer.byteLength,
        },
      })
      ids.push(String(created.id))
    } catch (err) {
      payload.logger.warn(`Media seed skipped for "${item.filename}": ${String(err)}`)
    }
  }

  return ids
}

// ── Main seed export ──────────────────────────────────────────────────────────

export async function seed(payload: Payload, config: TenantConfig): Promise<void> {
  // 1. Upsert tenant document
  const tenantId = await upsertTenant(payload, config)
  payload.logger.info(`Tenant upserted (id: ${tenantId})`)

  // 2. Media folders — root + one sub-folder per page
  const folderId = await upsertMediaFolder(payload, tenantId, config.name)
  payload.logger.info(`Media folder upserted: "${config.name}" (id: ${folderId})`)

  const homeFolderId  = await upsertMediaFolder(payload, tenantId, 'home',     folderId)
  const aboutFolderId = await upsertMediaFolder(payload, tenantId, 'about',    folderId)
  await upsertMediaFolder(payload, tenantId, 'services', folderId)
  await upsertMediaFolder(payload, tenantId, 'contact',  folderId)
  payload.logger.info(`Page sub-folders upserted under root folder ${folderId}`)

  // 3. Media (placeholder — skipped if MinIO unavailable), routed per page folder
  const heroIds  = await seedMedia(payload, tenantId, homeFolderId,  [{ alt: 'Acme hero image', filename: 'acme-hero.jpg' }])
  const aboutIds = await seedMedia(payload, tenantId, aboutFolderId, [{ alt: 'Acme team photo', filename: 'acme-about.jpg' }, { alt: 'Acme office', filename: 'acme-office.jpg' }])
  const mediaIds = [...heroIds, ...aboutIds]

  const tenant = Number(tenantId)

  // ── HOME ────────────────────────────────────────────────────────────────────

  const homeEn = {
    title: 'Home — Acme GmbH',
    slug: 'home',
    pageTemplate: 'home',
    heroSection: {
      heading: 'Proven Solutions for Modern Business',
      subheading: 'Acme GmbH delivers consulting, implementation, and support that drives measurable results for your organisation.',
      ctaLabel: 'Explore Our Services',
      ctaHref: '/en/services',
      backgroundImage: mediaIds[0] ? Number(mediaIds[0]) : null,
    },
    featuresSection: {
      heading: 'Why Acme?',
      features: [
        { title: 'Expert Consulting', description: 'Strategic advisory from seasoned professionals with decades of industry experience.', icon: '🎯' },
        { title: 'Seamless Implementation', description: 'Hands-on project delivery with proven methodologies and transparent milestones.', icon: '⚙️' },
        { title: 'Reliable Support', description: 'Ongoing maintenance and 24/7 assistance to keep your operations running smoothly.', icon: '🛡️' },
      ],
    },
    ctaSection: {
      heading: 'Ready to Start Your Project?',
      body: 'Get in touch today and let us show you what Acme GmbH can do for your business.',
      primaryLabel: 'Contact Us',
      primaryHref: '/en/contact',
      secondaryLabel: 'Learn More',
      secondaryHref: '/en/about',
    },
    meta: {
      title: 'Acme GmbH — Proven Solutions for Modern Business',
      description: 'Acme GmbH provides expert consulting, seamless implementation, and reliable support for businesses across Europe.',
    },
    tenant,
    _status: 'published' as const,
  }

  const homeDe = {
    title: 'Startseite — Acme GmbH',
    slug: 'home',
    pageTemplate: 'home',
    heroSection: {
      heading: 'Bewährte Lösungen für modernes Business',
      subheading: 'Acme GmbH liefert Beratung, Umsetzung und Support, der messbare Ergebnisse für Ihr Unternehmen erzielt.',
      ctaLabel: 'Unsere Leistungen entdecken',
      ctaHref: '/de/services',
      backgroundImage: mediaIds[0] ? Number(mediaIds[0]) : null,
    },
    featuresSection: {
      heading: 'Warum Acme?',
      features: [
        { title: 'Fachkundige Beratung', description: 'Strategische Begleitung durch erfahrene Experten mit jahrzehntelangem Branchenwissen.', icon: '🎯' },
        { title: 'Reibungslose Umsetzung', description: 'Praxisnahe Projektabwicklung mit bewährten Methoden und transparenten Meilensteinen.', icon: '⚙️' },
        { title: 'Zuverlässiger Support', description: 'Laufende Wartung und 24/7-Unterstützung, damit Ihr Betrieb stets reibungslos läuft.', icon: '🛡️' },
      ],
    },
    ctaSection: {
      heading: 'Bereit, Ihr Projekt zu starten?',
      body: 'Kontaktieren Sie uns noch heute und erfahren Sie, was Acme GmbH für Ihr Unternehmen leisten kann.',
      primaryLabel: 'Kontakt aufnehmen',
      primaryHref: '/de/contact',
      secondaryLabel: 'Mehr erfahren',
      secondaryHref: '/de/about',
    },
    meta: {
      title: 'Acme GmbH — Bewährte Lösungen für modernes Business',
      description: 'Acme GmbH bietet fachkundige Beratung, reibungslose Umsetzung und zuverlässigen Support für Unternehmen in ganz Europa.',
    },
    tenant,
    _status: 'published' as const,
  }

  await upsertPage(payload, tenantId, 'home', 'en', homeEn)
  await upsertPage(payload, tenantId, 'home', 'de', homeDe)
  payload.logger.info('Home pages seeded (en, de)')

  // ── ABOUT ────────────────────────────────────────────────────────────────────

  const aboutEn = {
    title: 'About — Acme GmbH',
    slug: 'about',
    pageTemplate: 'about',
    heroSection: {
      heading: 'About Acme GmbH',
      subheading: 'A trusted partner for businesses across Europe since 2005.',
    },
    bodyContent: {
      root: {
        type: 'root',
        children: [
          { type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0, children: [{ type: 'text', version: 1, text: 'Acme GmbH was founded in 2005 with a single mission: to make enterprise-grade consulting and technology delivery accessible to organisations of every size.' }] },
          { type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0, children: [{ type: 'text', version: 1, text: 'Over the past two decades we have partnered with more than 300 companies across 18 countries, helping them navigate complex challenges and emerge stronger, faster, and more resilient.' }] },
          { type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0, children: [{ type: 'text', version: 1, text: 'Our team of 120 specialists brings together deep expertise in strategy, engineering, and operations — always working as an extension of your own team, never as a distant vendor.' }] },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    },
    meta: {
      title: 'About Acme GmbH — Trusted Partner Since 2005',
      description: 'Learn about Acme GmbH, our history, our team, and our commitment to delivering measurable results for clients across Europe.',
    },
    tenant,
    _status: 'published' as const,
  }

  const aboutDe = {
    title: 'Über uns — Acme GmbH',
    slug: 'about',
    pageTemplate: 'about',
    heroSection: {
      heading: 'Über Acme GmbH',
      subheading: 'Ein verlässlicher Partner für Unternehmen in ganz Europa seit 2005.',
    },
    bodyContent: {
      root: {
        type: 'root',
        children: [
          { type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0, children: [{ type: 'text', version: 1, text: 'Acme GmbH wurde 2005 mit einer klaren Mission gegründet: Enterprise-Beratung und technologische Umsetzung für Unternehmen jeder Größe zugänglich zu machen.' }] },
          { type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0, children: [{ type: 'text', version: 1, text: 'In den vergangenen zwei Jahrzehnten haben wir mehr als 300 Unternehmen in 18 Ländern dabei begleitet, komplexe Herausforderungen zu meistern und gestärkt, schneller und widerstandsfähiger hervorzugehen.' }] },
          { type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0, children: [{ type: 'text', version: 1, text: 'Unser Team aus 120 Spezialisten vereint umfassendes Know-how in Strategie, Engineering und Betrieb — stets als Erweiterung Ihres eigenen Teams, nie als distanzierter Dienstleister.' }] },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    },
    meta: {
      title: 'Über Acme GmbH — Verlässlicher Partner seit 2005',
      description: 'Erfahren Sie mehr über Acme GmbH, unsere Geschichte, unser Team und unser Engagement für messbare Ergebnisse bei Kunden in ganz Europa.',
    },
    tenant,
    _status: 'published' as const,
  }

  await upsertPage(payload, tenantId, 'about', 'en', aboutEn)
  await upsertPage(payload, tenantId, 'about', 'de', aboutDe)
  payload.logger.info('About pages seeded (en, de)')

  // ── SERVICES ─────────────────────────────────────────────────────────────────

  const servicesEn = {
    title: 'Services — Acme GmbH',
    slug: 'services',
    pageTemplate: 'services',
    heroSection: {
      heading: 'Our Services',
      subheading: 'From strategy through to execution — Acme GmbH covers every stage of your project.',
    },
    featuresSection: {
      heading: 'What We Offer',
      features: [
        { title: 'Consulting', description: 'Strategic workshops, process audits, and roadmap planning to align your technology investments with business objectives.', icon: '🎯' },
        { title: 'Implementation', description: 'End-to-end project delivery: architecture design, agile sprints, quality assurance, and production rollout.', icon: '⚙️' },
        { title: 'Support', description: 'Managed services, incident response, and continuous improvement programmes that keep your systems healthy and your teams productive.', icon: '🛡️' },
      ],
    },
    ctaSection: {
      heading: 'Not Sure Where to Start?',
      body: 'Book a free 30-minute discovery call and we will help you identify the right service for your situation.',
      primaryLabel: 'Book a Discovery Call',
      primaryHref: '/en/contact',
    },
    meta: {
      title: 'Services — Consulting, Implementation & Support | Acme GmbH',
      description: 'Explore Acme GmbH\'s core services: strategic consulting, hands-on implementation, and ongoing managed support.',
    },
    tenant,
    _status: 'published' as const,
  }

  const servicesDe = {
    title: 'Leistungen — Acme GmbH',
    slug: 'services',
    pageTemplate: 'services',
    heroSection: {
      heading: 'Unsere Leistungen',
      subheading: 'Von der Strategie bis zur Umsetzung — Acme GmbH begleitet Sie durch jede Phase Ihres Projekts.',
    },
    featuresSection: {
      heading: 'Was wir bieten',
      features: [
        { title: 'Beratung', description: 'Strategische Workshops, Prozess-Audits und Roadmap-Planung, um Ihre Technologieinvestitionen mit Ihren Unternehmenszielen in Einklang zu bringen.', icon: '🎯' },
        { title: 'Umsetzung', description: 'Ganzheitliche Projektabwicklung: Architekturdesign, agile Sprints, Qualitätssicherung und Produktivschaltung.', icon: '⚙️' },
        { title: 'Support', description: 'Managed Services, Incident-Response und kontinuierliche Verbesserungsprogramme, die Ihre Systeme gesund und Ihre Teams produktiv halten.', icon: '🛡️' },
      ],
    },
    ctaSection: {
      heading: 'Nicht sicher, wo Sie anfangen sollen?',
      body: 'Buchen Sie ein kostenloses 30-minütiges Erstgespräch, und wir helfen Ihnen, die richtige Leistung für Ihre Situation zu finden.',
      primaryLabel: 'Erstgespräch buchen',
      primaryHref: '/de/contact',
    },
    meta: {
      title: 'Leistungen — Beratung, Umsetzung & Support | Acme GmbH',
      description: 'Entdecken Sie die Kernleistungen von Acme GmbH: strategische Beratung, praxisnahe Umsetzung und laufenden Managed Support.',
    },
    tenant,
    _status: 'published' as const,
  }

  await upsertPage(payload, tenantId, 'services', 'en', servicesEn)
  await upsertPage(payload, tenantId, 'services', 'de', servicesDe)
  payload.logger.info('Services pages seeded (en, de)')

  // ── CONTACT ───────────────────────────────────────────────────────────────────

  const contactEn = {
    title: 'Contact — Acme GmbH',
    slug: 'contact',
    pageTemplate: 'contact',
    contactDetails: {
      address: 'Musterstraße 42, 10115 Berlin, Germany',
      phone: '+49 30 123456-0',
      email: 'hello@acme.com',
      hours: 'Monday–Friday, 09:00–18:00 CET',
    },
    ctaSection: {
      heading: 'Send Us a Message',
      body: 'Fill in the form below and one of our team members will get back to you within one business day.',
      primaryLabel: 'Email Us Directly',
      primaryHref: 'mailto:hello@acme.com',
    },
    meta: {
      title: 'Contact Acme GmbH — Berlin, Germany',
      description: 'Get in touch with Acme GmbH. Visit us in Berlin or send an email to hello@acme.com — we reply within one business day.',
    },
    tenant,
    _status: 'published' as const,
  }

  const contactDe = {
    title: 'Kontakt — Acme GmbH',
    slug: 'contact',
    pageTemplate: 'contact',
    contactDetails: {
      address: 'Musterstraße 42, 10115 Berlin, Deutschland',
      phone: '+49 30 123456-0',
      email: 'hallo@acme.com',
      hours: 'Montag–Freitag, 09:00–18:00 Uhr MEZ',
    },
    ctaSection: {
      heading: 'Schreiben Sie uns',
      body: 'Füllen Sie das Formular aus und einer unserer Mitarbeiter meldet sich innerhalb eines Werktages bei Ihnen.',
      primaryLabel: 'Direkt per E-Mail',
      primaryHref: 'mailto:hallo@acme.com',
    },
    meta: {
      title: 'Kontakt — Acme GmbH, Berlin',
      description: 'Nehmen Sie Kontakt mit Acme GmbH auf. Besuchen Sie uns in Berlin oder schreiben Sie an hallo@acme.com — wir antworten innerhalb eines Werktages.',
    },
    tenant,
    _status: 'published' as const,
  }

  await upsertPage(payload, tenantId, 'contact', 'en', contactEn)
  await upsertPage(payload, tenantId, 'contact', 'de', contactDe)
  payload.logger.info('Contact pages seeded (en, de)')

  payload.logger.info(`✓ Acme tenant fully seeded (tenantId: ${tenantId})`)
}
