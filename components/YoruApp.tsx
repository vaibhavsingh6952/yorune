'use client'

import React, { useEffect, useState } from 'react'
import { MediaProvider } from './MediaContext'
import Preloader from './Preloader'
import BackgroundStream from './BackgroundStream'
import CustomPlayer from './CustomPlayer'
import Timer from './Timer'

export default function YoruApp() {
  return (
    <MediaProvider>
      <main
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          background: '#020205',
        }}
      >
        <BackgroundStream />
        <Timer />
        <CustomPlayer />
        <TopRight />
        <Preloader />
      </main>
    </MediaProvider>
  )
}

function useVisitorCount() {
  const BASE = 47
  const [count, setCount] = useState(BASE)
  useEffect(() => {
    let current = BASE + Math.floor(Math.random() * 20)
    setCount(current)
    let timeoutId: ReturnType<typeof setTimeout>
    const tick = () => {
      const delta = Math.random() < 0.5 ? 1 : -1
      current = Math.max(12, Math.min(120, current + delta))
      setCount(current)
      timeoutId = setTimeout(tick, 8000 + Math.random() * 12000)
    }
    timeoutId = setTimeout(tick, 8000 + Math.random() * 12000)
    return () => clearTimeout(timeoutId)
  }, [])
  return count
}

function TopRight() {
  const visitors = useVisitorCount()
  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 16,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 5,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        <span
          aria-label="yorune"
          style={{
            fontFamily: "'Shippori Mincho', serif",
            // Smaller on mobile
            fontSize: 'clamp(14px, 4vw, 20px)',
            fontWeight: 600,
            letterSpacing: '0.18em',
            color: 'rgba(255,255,255,0.75)',
            textShadow: '0 2px 20px rgba(0,0,0,0.5)',
          }}
        >
          yorune
        </span>
        <span
          style={{
            fontFamily: "'Shippori Mincho', serif",
            fontSize: 'clamp(7px, 2vw, 9px)',
            letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.2)',
          }}
        >
          よるね
        </span>
      </div>

      <div
        aria-label={`${visitors} people currently on site`}
        style={{ display: 'flex', alignItems: 'center', gap: 5 }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'rgba(180,160,255,0.45)',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: "'Shippori Mincho', serif",
            fontSize: 'clamp(9px, 2.5vw, 11px)',
            letterSpacing: '0.12em',
            color: 'rgba(255,255,255,0.32)',
          }}
        >
          {visitors} nin{' '}
          <span style={{ fontSize: 'clamp(10px, 2.5vw, 12px)', color: 'rgba(255,255,255,0.22)' }}>
            人
          </span>
        </span>
      </div>
    </div>
  )
}