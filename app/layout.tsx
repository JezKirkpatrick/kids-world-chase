import type { Metadata, Viewport } from 'next'
import './globals.css'
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister'
import InstallPrompt from '@/components/pwa/InstallPrompt'
import { ToastProvider } from '@/components/ui/Toast'
import OnlineUsersProvider from '@/components/ui/OnlineUsersProvider'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.kidsworldchase.com'),
  title: 'Kids World Chase — Explore the World!',
  description: "The exciting weekly geography adventure for kids aged 8–13. Solve fun riddles, explore Google Maps, learn amazing facts, and race to the global leaderboard!",
  applicationName: 'Kids World Chase',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Kids World Chase',
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: 'Kids World Chase — Explore the World!',
    description: 'Explore the World. Learn Geography. Become a Champion! Weekly geography adventure for kids.',
    type: 'website',
    url: 'https://www.kidsworldchase.com',
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
      </head>
      <body>
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
