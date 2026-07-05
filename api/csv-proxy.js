const allowedHosts = new Set([
  'docs.google.com',
  'drive.google.com',
  'drive.usercontent.google.com',
])

const toGoogleCsvUrl = (rawUrl) => {
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

  if (!allowedHosts.has(url.hostname)) {
    throw new Error('The CSV proxy currently supports Google Drive and Google Sheets links.')
  }

  return url.toString()
}

const sendJson = (response, status, payload) => {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.end(JSON.stringify(payload))
}

const looksLikeSourceCode = (text) => {
  const preview = text.trim().slice(0, 500)
  return /^\s*(?:import|export)\s+/i.test(preview)
    || /^\s*(?:const|let|var|function|class)\s+[\w$]/i.test(preview)
    || /^\s*if\s*\(/i.test(preview)
    || /sourceMappingURL=/.test(preview)
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    sendJson(response, 405, { error: 'Method not allowed.' })
    return
  }

  const rawUrl = Array.isArray(request.query?.url) ? request.query.url[0] : request.query?.url
  if (!rawUrl) {
    sendJson(response, 400, { error: 'Missing CSV link.' })
    return
  }

  let csvUrl
  try {
    csvUrl = toGoogleCsvUrl(rawUrl)
  } catch (error) {
    sendJson(response, 400, { error: error instanceof Error ? error.message : 'Invalid CSV link.' })
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
      sendJson(response, upstream.status, { error: `CSV link returned ${upstream.status}.` })
      return
    }

    if (/^\s*(<!doctype html|<html)/i.test(text)) {
      sendJson(response, 400, { error: 'This link returned a web page instead of CSV. Check sharing or export settings.' })
      return
    }
    if (looksLikeSourceCode(text)) {
      sendJson(response, 400, { error: 'This link returned app/source code instead of a MemoRing CSV file.' })
      return
    }

    response.statusCode = 200
    response.setHeader('Content-Type', 'text/csv; charset=utf-8')
    response.setHeader('Cache-Control', 'no-store')
    response.end(text)
  } catch {
    sendJson(response, 502, { error: 'Could not download this CSV link from the server.' })
  }
}
