'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useMedia } from './MediaContext'

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function formatTime(totalSeconds: number): { h: string; m: string; s: string } {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return { h: pad(h), m: pad(m), s: pad(s) }
}

export default function Timer() {
  const { isPreloaderVisible } = useMedia()
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [hasRevealed, setHasRevealed] = useState(false)
  const [timerOpacity, setTimerOpacity] = useState(0)
  // Keep the interval ref alive across renders — never cleared until unmount
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasRevealedRef = useRef(false)

  // Watch for the first hide of the preloader
  useEffect(() => {
    if (!isPreloaderVisible && !hasRevealedRef.current) {
      hasRevealedRef.current = true
      setHasRevealed(true)

      // Start the interval — stored in ref so it survives re-renders
      intervalRef.current = setInterval(() => {
        setTotalSeconds((prev) => prev + 1)
      }, 1000)

      // Fade the timer in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setTimerOpacity(1))
      })
    }
  }, [isPreloaderVisible])

  // Only clear on true unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  if (!hasRevealed) return null

  const { h, m, s } = formatTime(totalSeconds)

  const digitStyle: React.CSSProperties = {
    display: 'inline-block',
    width: '2ch',
    textAlign: 'center',
  }

  const colonStyle: React.CSSProperties = {
    display: 'inline-block',
    width: '0.6em',
    textAlign: 'center',
    opacity: 0.28,
    position: 'relative',
    top: '-0.06em',
  }

  return (
    <div
      role="timer"
      aria-label={`Focus timer: ${h} hours ${m} minutes ${s} seconds`}
      aria-live="off"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        pointerEvents: 'none',
        userSelect: 'none',
        opacity: timerOpacity,
        transition: 'opacity 1200ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div
        style={{
          fontFamily: "'Shippori Mincho', serif",
          fontSize: 'clamp(52px, 8vw, 96px)',
          fontWeight: 400,
          letterSpacing: 0,
          color: 'rgba(255,255,255,0.88)',
          textShadow: '0 0 60px rgba(180,160,255,0.15), 0 2px 40px rgba(0,0,0,0.6)',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '0.18em',
        }}
      >
        <span style={digitStyle}>{h}</span>
        <span style={colonStyle}>:</span>
        <span style={digitStyle}>{m}</span>
        <span style={colonStyle}>:</span>
        <span style={{ ...digitStyle, opacity: 0.55 }}>{s}</span>
      </div>

      <span
        style={{
          fontFamily: "'Shippori Mincho', serif",
          fontSize: 11,
          letterSpacing: '0.5em',
          color: 'rgba(255,255,255,0.2)',
          textTransform: 'uppercase',
          marginTop: 4,
        }}
      >
        your time
      </span>
    </div>
  )
}