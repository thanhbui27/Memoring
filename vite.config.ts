import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const allowedCsvProxyHosts = new Set([
  'docs.google.com',
  'drive.google.com',
  'drive.usercontent.google.com',
])

const toGoogleCsvUrl = (rawUrl: string) => {
  const url = new URL(rawUrl)

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http:// and https:// CSV links are supported.')
  }

  if (url.hostname === 'docs.google.com' && url.pathname.includes('/spreadsheets/d/')) {
    const spreadsheetId = url.pathname.match(/\/spreadsheets\/d\/([^/]+)/)?.[1]
    if (spreadsheetId) {
      const gidFromHash = url.hash.match(/gid=(\d+)/)?.[1]
      const gid = url.searchParams.get('gid') || gidFromHash || '0'
      return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`
    }
  }

  if (url.hostname === 'drive.google.com') {
    const fileId = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] || url.searchParams.get('id')
    if (fileId) {
      return `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download`
    }
  }

  if (!allowedCsvProxyHosts.has(url.hostname)) {
    throw new Error('The CSV proxy currently supports Google Drive and Google Sheets links.')
  }

  return url.toString()
}

const looksLikeSourceCode = (text: string) => {
  const preview = text.trim().slice(0, 500)
  return /^\s*(?:import|export)\s+/i.test(preview)
    || /^\s*(?:const|let|var|function|class)\s+[\w$]/i.test(preview)
    || /^\s*if\s*\(/i.test(preview)
    || /sourceMappingURL=/.test(preview)
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'memoring-csv-proxy',
      configureServer(server) {
        server.middlewares.use('/api/csv-proxy', async (request, response) => {
          const sendJson = (status: number, payload: { error: string }) => {
            response.statusCode = status
            response.setHeader('Content-Type', 'application/json; charset=utf-8')
            response.setHeader('Cache-Control', 'no-store')
            response.end(JSON.stringify(payload))
          }

          if (request.method !== 'GET') {
            response.setHeader('Allow', 'GET')
            sendJson(405, { error: 'Method not allowed.' })
            return
          }

          const requestUrl = new URL(request.url || '', 'http://localhost')
          const rawUrl = requestUrl.searchParams.get('url')
          if (!rawUrl) {
            sendJson(400, { error: 'Missing CSV link.' })
            return
          }

          let csvUrl: string
          try {
            csvUrl = toGoogleCsvUrl(rawUrl)
          } catch (error) {
            sendJson(400, { error: error instanceof Error ? error.message : 'Invalid CSV link.' })
            return
          }

          try {
            const upstream = await fetch(csvUrl, {
              headers: {
                Accept: 'text/csv,text/plain,*/*',
                'User-Agent': 'MemoRing CSV Import',
              },
              redirect: 'follow',
            })
            const text = await upstream.text()

            if (!upstream.ok) {
              sendJson(upstream.status, { error: `CSV link returned ${upstream.status}.` })
              return
            }

            if (/^\s*(<!doctype html|<html)/i.test(text)) {
              sendJson(400, { error: 'This link returned a web page instead of CSV. Check sharing or export settings.' })
              return
            }

            if (looksLikeSourceCode(text)) {
              sendJson(400, { error: 'This link returned app/source code instead of a MemoRing CSV file.' })
              return
            }

            response.statusCode = 200
            response.setHeader('Content-Type', 'text/csv; charset=utf-8')
            response.setHeader('Cache-Control', 'no-store')
            response.end(text)
          } catch {
            sendJson(502, { error: 'Could not download this CSV link from the server.' })
          }
        })
      },
    },
  ],
})
