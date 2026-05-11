import { getPayload } from 'payload'
import config from '@payload-config'

// Singleton Payload client for use in RSC and server utilities.
// Payload deduplicates connections internally; safe to call on every request.
export async function getPayloadClient() {
  return getPayload({ config })
}
