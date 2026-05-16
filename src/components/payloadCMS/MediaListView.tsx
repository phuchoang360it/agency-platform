'use client'
import { DefaultListView } from '@payloadcms/ui'
import type { ListViewClientProps } from 'payload'

export const MediaListView = (props: ListViewClientProps) => {
  return <DefaultListView {...props} hasCreatePermission={false} />
}
