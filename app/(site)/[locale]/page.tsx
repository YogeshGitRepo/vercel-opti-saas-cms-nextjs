import ContentAreaMapper from '@/components/content-area/mapper'
import DraftModeHomePage from '@/components/draft/draft-mode-homepage'
import { DraftModeLoader } from '@/components/draft/draft-mode-loader'
import { optimizely } from '@/lib/optimizely/fetch'
import { getValidLocale } from '@/lib/optimizely/utils/language'
import { generateAlternates } from '@/lib/utils/metadata'
import { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await props.params
  const locales = getValidLocale(locale)

  const pageResp = await optimizely.GetStartPage({ locales })
  const page = pageResp.data?.StartPage?.item

  if (!page) return {}

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

  const { isEnabled } = await draftMode()

  if (isEnabled) {
    return (
      <Suspense fallback={<DraftModeLoader />}>
        <DraftModeHomePage locales={locales} />
      </Suspense>
    )
  }

  const pageResponse = await optimizely.GetStartPage(
    { locales },
    { preview: false }
  )

  const startPage = pageResponse.data?.StartPage?.item

  if (!startPage) {
    return <div>No homepage content found.</div>
  }

  const blocks = (startPage.blocks ?? []).filter(Boolean)

  return (
  <pre>{JSON.stringify(blocks, null, 2)}</pre>
)
}