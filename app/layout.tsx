import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import './globals.css'
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister'
import InstallPrompt from '@/components/pwa/InstallPrompt'
import { ToastProvider } from '@/components/ui/Toast'
import OnlineUsersProvider from '@/components/ui/OnlineUsersProvider'
import NextTopLoader from 'nextjs-toploader'
import ScrollToTop from '@/components/ui/ScrollToTop'

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
          dangerouslySetInnerHTML={{ __html: JSON.stringify([
            {
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Kids World Chase',
              url: 'https://www.kidsworldchase.net',
              logo: 'https://www.kidsworldchase.net/icon.png',
              sameAs: ['https://www.worldchase.net'],
            },
            {
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Kids World Chase',
              url: 'https://www.kidsworldchase.net',
            },
            {
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Kids World Chase',
              applicationCategory: 'GameApplication',
              applicationSubCategory: 'Educational Geography Game',
              operatingSystem: 'Any',
              browserRequirements: 'Requires JavaScript',
              url: 'https://www.kidsworldchase.net',
              description: 'The exciting weekly geography adventure for kids aged 8–13. Solve fun riddles, explore Google Maps, and race to the global leaderboard.',
              typicalAgeRange: '8-13',
              audience: { '@type': 'EducationalAudience', audienceType: 'Children', educationalRole: 'student' },
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
              publisher: { '@type': 'Organization', name: 'Kids World Chase', url: 'https://www.kidsworldchase.net' },
            },
            {
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
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
              publisher: { '@type': 'Organization', name: 'Kids World Chase', url: 'https://www.kidsworldchase.net' },
            },
          ]) }}
        />
      </head>
      <body>
        <Script
          id="fb-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1613984633019651');
              fbq('track', 'PageView');
            `,
          }}
        />
        <ScrollToTop />
        <NextTopLoader color="#F5A623" height={3} showSpinner={false} />
        <OnlineUsersProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
          <ServiceWorkerRegister />
          <InstallPrompt />
        </OnlineUsersProvider>
        <footer className="border-t border-white/8 bg-navy">
          <div className="max-w-5xl mx-auto px-6 py-10">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
              <div>
                <div className="font-head font-bold text-xs text-text-muted tracking-widest mb-3">PLAY</div>
                <ul className="space-y-2">
                  <li><Link href="/leaderboard" className="font-head text-xs text-text-muted hover:text-gold transition-colors">Leaderboard</Link></li>
                  <li><Link href="/how-to-play" className="font-head text-xs text-text-muted hover:text-gold transition-colors">How to Play</Link></li>
                  <li><Link href="/daily" className="font-head text-xs text-text-muted hover:text-gold transition-colors">Daily Flag Puzzle</Link></li>
                  <li><Link href="/quiz" className="font-head text-xs text-text-muted hover:text-gold transition-colors">Quiz</Link></li>
                </ul>
              </div>
              <div>
                <div className="font-head font-bold text-xs text-text-muted tracking-widest mb-3">EXPLORE</div>
                <ul className="space-y-2">
                  <li><Link href="/hall-of-fame" className="font-head text-xs text-text-muted hover:text-gold transition-colors">Hall of Fame</Link></li>
                  <li><Link href="/archive" className="font-head text-xs text-text-muted hover:text-gold transition-colors">Archive</Link></li>
                  <li><Link href="/shop" className="font-head text-xs text-text-muted hover:text-gold transition-colors">Shop</Link></li>
                </ul>
              </div>
              <div>
                <div className="font-head font-bold text-xs text-text-muted tracking-widest mb-3">INFO</div>
                <ul className="space-y-2">
                  <li><Link href="/support" className="font-head text-xs text-text-muted hover:text-gold transition-colors">Support</Link></li>
                  <li><Link href="/privacy" className="font-head text-xs text-text-muted hover:text-gold transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="font-head text-xs text-text-muted hover:text-gold transition-colors">Terms of Service</Link></li>
                </ul>
              </div>
              <div>
                <div className="font-head font-bold text-xs text-text-muted tracking-widest mb-3">SISTER SITE</div>
                <a href="https://www.worldchase.net" className="font-head text-xs text-electric hover:text-white transition-colors">World Chase ↗</a>
                <p className="font-head text-xs text-text-muted mt-1 leading-relaxed">The adult geography game</p>
              </div>
            </div>
            <div className="border-t border-white/8 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="font-head font-bold text-gold text-sm tracking-widest">KIDS WORLD CHASE</span>
              <span className="font-head text-xs text-text-muted">© {new Date().getFullYear()} Kids World Chase — Free Geography Game for Kids</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
