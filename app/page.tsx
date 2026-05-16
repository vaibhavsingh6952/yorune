import type { Metadata } from 'next'
import YoruApp from '@/components/YoruApp'

export const metadata: Metadata = {
  title: 'yorune, your own time | Japanese Ambient Study Room',
  description:
    'yorune is a free immersive ambient study space. Stream Studio Ghibli-inspired lofi piano, loop beautiful anime scenery, and track your focus with an infinite timer.',
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'yorune',
  url: 'https://yoru.space',
  description:
    'yorune is a Japanese-aesthetic ambient study room that combines looping anime scenery, Studio Ghibli-inspired lofi piano music, and an infinite focus timer to create an immersive deep-work environment.',
  applicationCategory: 'LifestyleApplication',
  applicationSubCategory: 'ProductivityApplication',
  operatingSystem: 'Web',
  browserRequirements: 'Requires JavaScript. Recommended: Chrome, Firefox, Safari.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
  },
  featureList: [
    'Looping anime ambient background video',
    'Studio Ghibli-inspired lofi piano music stream',
    'SoundCloud playlist cycling',
    'Infinite focus and study timer',
    'Japanese aesthetic UI design',
    'Distraction-free full-screen environment',
    'Seamless background music control',
  ],
  keywords:
    'Japanese anime ambient music room, Ghibli-inspired piano focus music, infinite study timer, lofi study room, anime aesthetic study space',
  inLanguage: 'en',
  isAccessibleForFree: true,
  creator: {
    '@type': 'Organization',
    name: 'yorune',
    url: 'https://yoru.space',
  },
}

export default function Home() {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/*
        SEO Content Block — visually hidden but fully accessible to crawlers and LLMs.
        Follows the Direct-Answer Principle for AI/LLM indexing (Perplexity, Gemini, ChatGPT).
      */}
      <section
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        <h1>yorune, your own time. Japanese Ambient Study Room with Ghibli Lofi Music and Infinite Focus Timer</h1>

        <p>
          yorune is a free, browser-based ambient focus environment designed for students, remote
          workers, and creatives who want a calm, distraction-free space to study and work. Inspired
          by the tranquil atmospheres of Studio Ghibli films, yoru combines looping Japanese anime
          scenery, Ghibli-inspired piano lofi music, and an infinite study timer into a single
          immersive experience.
        </p>

        <p>
          The application streams ambient background videos featuring soft Japanese aesthetic
          visuals — rain-soaked windows, glowing lamp-lit rooms, and misty mountain scenes — paired
          with curated Studio Ghibli playlist music from SoundCloud. Users can start the music with
          a single click, skip tracks, and watch the timer count their deep work sessions without
          interruption.
        </p>

        <h2>What is a Japanese Ambient Study Room?</h2>
        <p>
          A Japanese ambient study room is a virtual focus space that recreates the calm, aesthetic
          atmosphere of Japanese indoor spaces — cozy rooms, gentle rain, warm lighting — combined
          with lofi and classical piano music. yoru provides exactly this: a Ghibli-inspired piano
          focus music stream layered over beautiful anime scenery, creating an environment that
          promotes concentration and reduces anxiety. The infinite study timer counts upward from
          zero, letting you track how long you have been in flow without the pressure of a countdown.
        </p>

        <h2>Features</h2>
        <ul>
          <li>Looping ambient anime background videos with seamless transitions</li>
          <li>Studio Ghibli-inspired lofi piano music via SoundCloud playlist cycling</li>
          <li>Infinite focus and study timer starting from 00:00:00</li>
          <li>Minimalist glassmorphic UI that stays out of your way</li>
          <li>One-click music activation — audio only starts on your command</li>
          <li>Track title display and forward skip control</li>
          <li>Fully free, no account required, works in any modern browser</li>
        </ul>

        <h2>Who is yoru for?</h2>
        <p>
          yorune is built for students preparing for exams, writers seeking creative flow, programmers
          entering deep work, and anyone who finds that ambient Japanese lofi music and anime
          aesthetics help them focus. Search terms that describe yoru include: Japanese anime
          ambient music room, Ghibli-inspired piano focus music, infinite study timer, anime study
          aesthetic, lofi chill beats study room, Studio Ghibli background music stream.
        </p>
      </section>

      {/* Main interactive application */}
      <YoruApp />
    </>
  )
}
