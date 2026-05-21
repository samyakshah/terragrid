import type { LayoutRow, SiteConfig, SiteSummary } from '@shared/types'

interface ExportPdfInput {
  layout: LayoutRow[]
  config: SiteConfig
  summary: SiteSummary
}

export async function exportLayoutPdf({ layout, config, summary }: ExportPdfInput): Promise<void> {
  const [{ pdf }, { SiteReport }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./SiteReport'),
  ])

  const blob = await pdf(
    <SiteReport layout={layout} config={config} summary={summary} generatedAt={new Date()} />,
  ).toBlob()

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `terragrid-site-layout-${Date.now()}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
