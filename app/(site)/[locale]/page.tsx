import ContentAreaMapper from '@/components/content-area/mapper'
import DraftModeHomePage from '@/components/draft/draft-mode-homepage'
import { DraftModeLoader } from '@/components/draft/draft-mode-loader'
import { optimizely } from '@/lib/optimizely/fetch'
import { getValidLocale } from '@/lib/optimizely/utils/language'
import { generateAlternates } from '@/lib/utils/metadata'
import { Metadata } from 'next'
import { draftMode, headers } from 'next/headers'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic' // REQUIRED for CMS preview

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await props.params
  const locales = getValidLocale(locale)

  const pageResp = await optimizely.GetStartPage({ locales })
  const page = pageResp.data?.StartPage?.item

  if (!page) {
    return {}
  }

  return {
    title: page.title,
    description: page.shortDescription || '',
    keywords: page.keywords ?? '',
    alternates: generateAlternates(locale, '/'),
  }
}

export default async function HomePage(props: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await props.params
  const locales = getValidLocale(locale)

 const h = await headers()

  // Detect Optimizely CMS preview / edit mode
  const isPreview =
    h.get('x-epieditmode') === 'true' ||
    h.get('x-epi-preview') === 'true'

  const { isEnabled: isDraftModeEnabled } = await draftMode()

  // ✅ Draft mode (your existing implementation)
  if (isDraftModeEnabled) {
    return (
      <Suspense fallback={<DraftModeLoader />}>
        <DraftModeHomePage locales={locales} />
      </Suspense>
    )
  }

  // IMPORTANT: pass preview flag to SDK
  const pageResponse = await optimizely.GetStartPage(
    { locales },
    { preview: isPreview }
  )

  const startPage = pageResponse.data?.StartPage?.item

  const blocks = (startPage?.blocks ?? []).filter(
    (block) => block !== null && block !== undefined
  )

  return (
    <Suspense>
      <ContentAreaMapper blocks={blocks} />
    </Suspense>
  )
}
