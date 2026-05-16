'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import Script from 'next/script'

const PLAYLISTS = [
  'https://soundcloud.com/okami1/sets/ghibli-playlist',
  'https://soundcloud.com/hiim-pupcake/sets/studio-ghibli-playlist',
  'https://soundcloud.com/user-69454755/sets/studio-ghibli-playlist',
]

declare global {
  interface Window {
    SC: { Widget: (iframe: HTMLIFrameElement) => SCWidget }
  }
  interface SCWidget {
    bind: (event: string, callback: (...args: unknown[]) => void) => void
    play: () => void
    pause: () => void
    next: () => void
    getCurrentSound: (callback: (sound: SCSound | null) => void) => void
    load: (url: string, options: Record<string, boolean | number>) => void
  }
  interface SCSound {
    title?: string
    user?: { username?: string }
  }
}

const SC_EVENTS = { FINISH: 'finish', PLAY: 'play', PAUSE: 'pause' } as const

function buildEmbedUrl(url: string) {
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=false&buying=false&liking=false&download=false&sharing=false&show_artwork=false&show_comments=false&show_playcount=false&show_user=false&hide_related=true&visual=false&start_track=0&single_active=true`
}

function cleanTitle(raw: string) {
  return (
    raw
      .replace(/\s*[\u2014\u2013\-|]\s*.*/g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .trim() || raw
  )
}

export default function CustomPlayer() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const widgetRef = useRef<SCWidget | null>(null)
  const playlistIndexRef = useRef(0)
  const hasInteractedRef = useRef(false)
  const isScriptLoadedRef = useRef(false)

  const [trackTitle, setTrackTitle] = useState('Ghibli Playlist')
  const [artist, setArtist] = useState('Studio Ghibli Lofi')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [embedUrl, setEmbedUrl] = useState(buildEmbedUrl(PLAYLISTS[0]))
  const [activePlaylistIndex, setActivePlaylistIndex] = useState(0)

  useEffect(() => { setIsMounted(true) }, [])

  const updateTrackInfo = useCallback(() => {
    widgetRef.current?.getCurrentSound((sound) => {
      if (sound) {
        setTrackTitle(cleanTitle(sound.title || 'Unknown Track'))
        setArtist(sound.user?.username || 'Ghibli Lofi')
      }
    })
  }, [])

  const bindWidgetEvents = useCallback(() => {
    const w = widgetRef.current
    if (!w) return
    w.bind(SC_EVENTS.PLAY, () => { setIsPlaying(true); updateTrackInfo() })
    w.bind(SC_EVENTS.PAUSE, () => setIsPlaying(false))
    w.bind(SC_EVENTS.FINISH, () => {
      const next = (playlistIndexRef.current + 1) % PLAYLISTS.length
      playlistIndexRef.current = next
      setActivePlaylistIndex(next)
      const nextUrl = PLAYLISTS[next]
      setEmbedUrl(buildEmbedUrl(nextUrl))
      setTimeout(() => {
        widgetRef.current?.load(nextUrl, {
          auto_play: hasInteractedRef.current ? 1 : 0,
          buying: 0, liking: 0, download: 0, sharing: 0,
          show_artwork: 0, show_comments: 0, show_playcount: 0,
          show_user: 0, hide_related: 1, visual: 0,
        })
      }, 800)
    })
  }, [updateTrackInfo])

  const initWidget = useCallback(() => {
    if (!iframeRef.current || !window.SC) return
    widgetRef.current = window.SC.Widget(iframeRef.current)
    bindWidgetEvents()
  }, [bindWidgetEvents])

  const handleScriptLoad = useCallback(() => {
    isScriptLoadedRef.current = true
    setTimeout(initWidget, 500)
  }, [initWidget])

  const handlePlayPause = useCallback(() => {
    const w = widgetRef.current
    if (!w) return
    if (!hasInteractedRef.current) { hasInteractedRef.current = true; w.play(); return }
    isPlaying ? w.pause() : w.play()
  }, [isPlaying])

  const handleNext = useCallback(() => {
    const w = widgetRef.current
    if (!w) return
    if (!hasInteractedRef.current) { hasInteractedRef.current = true; w.play(); return }
    w.next()
    setTimeout(updateTrackInfo, 600)
  }, [updateTrackInfo])

  if (!isMounted) return null

  const circleBtn: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background 0.2s ease, transform 0.15s ease',
    position: 'relative',
    overflow: 'hidden',
  }

  return (
    <>
      <Script
        src="https://w.soundcloud.com/player/api.js"
        strategy="lazyOnload"
        onLoad={handleScriptLoad}
      />

      {/* Hidden SC iframe — encrypted-media added to allow to suppress policy error */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          bottom: -9999,
          left: -9999,
          width: 1,
          height: 1,
          overflow: 'hidden',
          pointerEvents: 'none',
          opacity: 0,
        }}
      >
        <iframe
          ref={iframeRef}
          id="sc-player-iframe"
          src={embedUrl}
          width="100%"
          height="166"
          scrolling="no"
          frameBorder="no"
          // Added encrypted-media to stop the permissions policy console error
          allow="autoplay; encrypted-media"
          title="SoundCloud Player"
          onLoad={() => { if (isScriptLoadedRef.current) initWidget() }}
        />
      </div>

      {/* ── Player card ── */}
      <div
        role="region"
        aria-label="Music player"
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 10,
          width: 'min(224px, calc(100vw - 32px))',
          background: 'rgba(6, 4, 14, 0.42)',
          backdropFilter: 'blur(36px) saturate(1.9)',
          WebkitBackdropFilter: 'blur(36px) saturate(1.9)',
          border: 'none',
          borderRadius: 18,
          // overflow hidden keeps everything — including waveform — clipped inside
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 16px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            // Explicit width so children can't exceed it
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Track info row — waveform inline with title, no separate row that can escape */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Title + inline waveform */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span
                style={{
                  fontFamily: "'Shippori Mincho', serif",
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.88)',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  // flex-shrink so title yields space to waveform
                  flex: 1,
                  minWidth: 0,
                }}
                title={trackTitle}
              >
                {trackTitle}
              </span>
              {/* Waveform sits INLINE next to title — never escapes the flex row */}
              {isPlaying && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 2,
                    height: 14,
                    flexShrink: 0,
                  }}
                >
                  {[4, 10, 6, 9, 4].map((h, i) => (
                    <div
                      key={i}
                      style={{
                        width: 2,
                        height: h,
                        borderRadius: 2,
                        background: 'rgba(180,160,255,0.85)',
                        animation: `yw ${0.55 + i * 0.1}s ease-in-out infinite alternate`,
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Artist */}
            <span
              style={{
                fontFamily: "'Shippori Mincho', serif",
                fontSize: 11,
                color: 'rgba(255,255,255,0.32)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {artist}
            </span>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <button
              onClick={handlePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              style={{ ...circleBtn, background: 'rgba(255,255,255,0.13)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.23)'
                e.currentTarget.style.transform = 'scale(1.07)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.13)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>

            <button
              onClick={handleNext}
              aria-label="Next track"
              style={{ ...circleBtn, background: 'rgba(255,255,255,0.07)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.16)'
                e.currentTarget.style.transform = 'scale(1.07)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <NextIcon />
            </button>

            {/* Playlist dots */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
              {PLAYLISTS.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === activePlaylistIndex ? 12 : 4,
                    height: 4,
                    borderRadius: 3,
                    background:
                      i === activePlaylistIndex
                        ? 'rgba(180,160,255,0.75)'
                        : 'rgba(255,255,255,0.18)',
                    transition: 'all 0.35s ease',
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Animation keyframes scoped inside the card element */}
        <style>{`
          @keyframes yw {
            from { transform: scaleY(0.3); }
            to   { transform: scaleY(1);   }
          }
        `}</style>
      </div>
    </>
  )
}

function PlayIcon() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24"
      fill="rgba(255,255,255,0.9)"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24"
      fill="rgba(255,255,255,0.9)"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  )
}

function NextIcon() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24"
      fill="rgba(255,255,255,0.65)"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <polygon points="5 4 15 12 5 20 5 4" />
      <line
        x1="19" y1="4" x2="19" y2="20"
        stroke="rgba(255,255,255,0.65)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}