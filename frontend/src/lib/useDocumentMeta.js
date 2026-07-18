import { useEffect } from 'react'

// Lightweight per-page <title>/meta-description/canonical updater for the
// handful of public static pages (Privacy, Terms, Help) — without this,
// every route shared index.html's tags, so crawlers saw /privacy and
// /terms self-report their canonical as the homepage, which suppresses
// them from being indexed as distinct pages. Restores the app-wide
// defaults on unmount so navigating back into the private SPA doesn't
// leave a stale title/canonical behind.
export function useDocumentMeta({ title, description, path }) {
  useEffect(() => {
    const descTag = document.querySelector('meta[name="description"]')
    const canonicalTag = document.querySelector('link[rel="canonical"]')
    const prevTitle = document.title
    const prevDesc = descTag?.getAttribute('content')
    const prevCanonical = canonicalTag?.getAttribute('href')

    if (title) document.title = title
    if (description && descTag) descTag.setAttribute('content', description)
    if (path && canonicalTag) canonicalTag.setAttribute('href', `https://heyviya.vercel.app${path}`)

    return () => {
      document.title = prevTitle
      if (prevDesc !== undefined && descTag) descTag.setAttribute('content', prevDesc)
      if (prevCanonical !== undefined && canonicalTag) canonicalTag.setAttribute('href', prevCanonical)
    }
  }, [title, description, path])
}
