import './globals.css'

export const viewport = {
  themeColor: '#1A1612',
}

export const metadata = {
  title: 'Simply Sous — Dinner, decided.',
  description: 'AI meal planning for families. Plan your week, build your grocery list, and walk into the kitchen knowing exactly what to make.',
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.svg',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Simply Sous — Dinner, decided.',
    description: 'Stop answering the dinner question. AI meal planning for busy families.',
    url: 'https://simplysous.com',
    siteName: 'Simply Sous',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Outfit:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
