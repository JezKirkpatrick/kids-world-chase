import type { Metadata, Viewport } from 'next'
import './globals.css'
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister'
import InstallPrompt from '@/components/pwa/InstallPrompt'
import { ToastProvider } from '@/components/ui/Toast'
import OnlineUsersProvider from '@/components/ui/OnlineUsersProvider'
import NextTopLoader from 'nextjs-toploader'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.kidsworldchase.net'),
  title: {
    default: 'Kids World Chase — Explore the World!',
    template: '%s | Kids World Chase',
  },
  description: "The exciting weekly geography adventure for kids aged 8–13. Solve fun riddles, explore Google Maps, learn amazing facts, and race to the global leaderboard!",
  keywords: [
    'geography game for kids', 'kids geography quiz', "children's geography game", 'educational geography game',
    'fun geography for kids', 'interactive geography learning', 'kids world map quiz', 'online geography for children',
    'school geography game', 'kids country quiz', 'geography for ages 8-13', 'learn world geography kids',
    'geography puzzle kids', 'educational map game', 'kids geography adventure',
  ],
  applicationName: 'Kids World Chase',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Kids World Chase',
  },
  formatDetection: { telephone: false },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    title: 'Kids World Chase — Explore the World!',
    description: 'Explore the World. Learn Geography. Become a Champion! Weekly geography adventure for kids aged 8–13.',
    type: 'website',
    url: 'https://www.kidsworldchase.net',
    siteName: 'Kids World Chase',
    images: [{
      url: '/opengraph-image',
      width: 1200,
      height: 630,
      alt: 'Kids World Chase — Explore the World!',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kids World Chase — Explore the World!',
    description: 'Explore the World. Learn Geography. Become a Champion! Weekly geography adventure for kids.',
    images: ['/opengraph-image'],
  },
}

export const viewport: Viewport = {
  themeColor: '#0B1628',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/icon.png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'VideoGame',
            name: 'Kids World Chase',
            description: 'The exciting weekly geography adventure for kids aged 8–13. Solve fun riddles, explore Google Maps, and race to the global leaderboard.',
            url: 'https://www.kidsworldchase.net',
            genre: ['Geography', 'Educational', 'Quiz', 'Puzzle'],
            gamePlatform: 'Web Browser',
            operatingSystem: 'Any',
            applicationCategory: 'EducationalApplication',
            typicalAgeRange: '8-13',
            audience: { '@type': 'EducationalAudience', audienceType: 'Children', educationalRole: 'student' },
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'NZD', availability: 'https://schema.org/InStock' },
            publisher: { '@type': 'Organization', name: 'Kids World Chase', url: 'https://www.kidsworldchase.net' },
          }) }}
        />
      </head>
      <body>
        <NextTopLoader color="#F5A623" height={3} showSpinner={false} />
        <OnlineUsersProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
          <ServiceWorkerRegister />
          <InstallPrompt />
        </OnlineUsersProvider>
      </body>
    </html>
  )
}
