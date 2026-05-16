'use client'

import React, { useEffect, useState } from 'react'
import { useMedia } from './MediaContext'

export default function Preloader() {
  const { isPreloaderVisible } = useMedia()
  const [visible, setVisible] = useState(true)
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    if (!isPreloaderVisible) {
      setOpacity(0)
      const t = setTimeout(() => setVisible(false), 1100)
      return () => clearTimeout(t)
    } else {
      setVisible(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setOpacity(1))
      })
    }
  }, [isPreloaderVisible])

  if (!visible) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: '#020205',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
        transition: 'opacity 1000ms cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: isPreloaderVisible ? 'all' : 'none',
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(180,160,255,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Wordmark only — no dots, no animation */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          position: 'relative',
        }}
      >
        <span
          style={{
            fontFamily: "'Shippori Mincho', serif",
            fontSize: 38,
            fontWeight: 600,
            letterSpacing: '0.25em',
            color: 'rgba(255,255,255,0.88)',
            textShadow: '0 0 60px rgba(180,160,255,0.2)',
          }}
        >
          yorune
        </span>
        <span
          style={{
            fontFamily: "'Shippori Mincho', serif",
            fontSize: 16,
            letterSpacing: '0.2em',
            color: 'rgba(255,255,255,0.28)',
          }}
        >
          entering your space
        </span>
      </div>
    </div>
  )
}