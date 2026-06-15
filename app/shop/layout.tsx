import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Customise your Kids World Chase profile with fun avatars, borders, and titles. Earn tokens by playing or unlock special cosmetics to show off your explorer style!',
  keywords: ['kids world chase shop', 'geography game avatars for kids', 'kids game cosmetics', 'explorer profile customisation'],
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children
}
