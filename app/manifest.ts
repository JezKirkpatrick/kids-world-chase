import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kids World Chase',
    short_name: 'KidsWorldChase',
    description: 'The exciting weekly geography adventure for kids aged 8-13. Solve fun riddles, explore maps, and race to the leaderboard!',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0B1628',
    theme_color: '#0B1628',
    orientation: 'portrait-primary',
    categories: ['games', 'education'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [],
  }
}
