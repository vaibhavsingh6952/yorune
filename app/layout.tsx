import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://yorune.space'),
  title: {
    default: 'yorune, your own time and space',
    template: '%s | yorune',
  },
  description:
    'yorune is a free, immersive ambient focus room inspired by Studio Ghibli aesthetics. Stream lofi piano music, Japanese anime soundscapes, and use an infinite study timer to enter deep work mode.',
  keywords: [
    'Japanese anime ambient music room',
    'Ghibli-inspired piano focus music',
    'infinite study timer',
    'lofi study room',
    'Ghibli ambient study',
    'focus music stream',
    'anime aesthetic study space',
    'lofi hip hop study',
    'deep work ambient sound',
    'yoru night study room',
    'Studio Ghibli background music',
    'japanese lofi chill',
    'focus flow timer',
    'ambient study environment',
    'chill anime study beats',
  ],
  authors: [{ name: 'yorune' }],
  creator: 'yorune',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://yorune.space',
    siteName: 'yorune',
    title: 'yorune, Japanese Ambient Study Room',
    description:
      'Immerse yourself in a Ghibli-inspired ambient study space. Looping anime scenery, soothing lofi piano, and an infinite focus timer. Free forever.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'yorune, Japanese Ambient Study Room with Ghibli Lofi Music',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'yorune, Japanese Ambient Study Room',
    description:
      'Ghibli-inspired focus music, looping anime backgrounds, and an infinite timer. The study room you actually want to stay in.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://yoru.space',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="theme-color" content="#020205" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body>{children}</body>
    </html>
  )
}
