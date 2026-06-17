const KEY = 'b4e8d2f6a9c1e3b7'
const BASE = 'https://www.kidsworldchase.net'

export const PUBLIC_URLS = [
  BASE,
  `${BASE}/leaderboard`,
  `${BASE}/how-to-play`,
  `${BASE}/daily`,
  `${BASE}/quiz`,
  `${BASE}/hall-of-fame`,
  `${BASE}/archive`,
  `${BASE}/shop`,
  `${BASE}/support`,
]

export async function pingIndexNow(urls: string[] = PUBLIC_URLS) {
  try {
    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: 'www.kidsworldchase.net',
        key: KEY,
        keyLocation: `${BASE}/${KEY}.txt`,
        urlList: urls,
      }),
    })
  } catch {
    // non-critical
  }
}
