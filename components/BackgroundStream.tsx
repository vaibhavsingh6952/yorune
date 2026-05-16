'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import Script from 'next/script'
import { useMedia } from './MediaContext'

const VIDEO_IDS = ['h5qnNzpv6_k', 'CeItO4-ARfk', 'qHiYRNMq11A']

const VIDEO_DURATIONS: Record<string, number> = {
  'h5qnNzpv6_k': 14400,
  'CeItO4-ARfk': 3600,
  'qHiYRNMq11A': 7200,
}

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: {
          videoId: string
          playerVars?: Record<string, number | string>
          events?: {
            onReady?: (event: { target: YTPlayer }) => void
            onStateChange?: (event: { data: number }) => void
            onError?: (event: { data: number }) => void
          }
        }
      ) => YTPlayer
      PlayerState: { ENDED: number; PLAYING: number; PAUSED: number; BUFFERING: number; CUED: number }
    }
    onYouTubeIframeAPIReady: () => void
  }
  interface YTPlayer {
    loadVideoById: (options: { videoId: string; startSeconds: number; suggestedQuality: string }) => void
    playVideo: () => void
    seekTo: (seconds: number, allowSeekAhead: boolean) => void
    getCurrentTime: () => number
    getDuration: () => number
    destroy: () => void
    getPlayerState: () => number
    setPlaybackQuality: (quality: string) => void
    getPlaybackQuality: () => string
    getAvailableQualityLevels: () => string[]
  }
}

function getRandomStartTime(videoId: string): number {
  const duration = VIDEO_DURATIONS[videoId] ?? 3600
  return Math.floor(Math.random() * duration * 0.4)
}

// Build the iframe src URL with hd1080 baked in as a URL param.
// This is the strongest quality hint YouTube still partially honours —
// it sets the *initial* requested quality before adaptive kicks in.
function buildPlayerSrc(videoId: string, startSeconds: number): string {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0',
    disablekb: '1',
    fs: '0',
    iv_load_policy: '3',
    loop: '0',
    modestbranding: '1',
    playsinline: '1',
    rel: '0',
    showinfo: '0',
    enablejsapi: '1',
    start: String(startSeconds),
    // Key quality params in the URL itself
    vq: 'hd1080',
    hd: '1',
  })
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
}

// Force the highest available quality level on the player object
function forceHighQuality(player: YTPlayer) {
  try {
    // Try to get available levels and pick the best one
    const levels = player.getAvailableQualityLevels()
    if (levels && levels.length > 0) {
      // levels are ordered best-first: ['hd1080', 'hd720', 'large', ...]
      player.setPlaybackQuality(levels[0])
    } else {
      player.setPlaybackQuality('hd1080')
    }
  } catch (_) {
    try { player.setPlaybackQuality('hd1080') } catch (_) {}
  }
}

export default function BackgroundStream() {
  const { setCurrentVideoIndex, hidePreloader, showPreloader } = useMedia()

  const playerRef = useRef<YTPlayer | null>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const indexRef = useRef(0)
  const initialRevealDoneRef = useRef(false)
  const loopGuardRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const qualityGuardRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const transitioningRef = useRef(false)

  // ─── Quality guard: re-assert hd1080 every 5 s ───────────────────────────
  // YouTube's adaptive algorithm can silently downgrade quality mid-stream.
  // Polling and re-asserting is the only way to push back against it.
  const startQualityGuard = useCallback(() => {
    if (qualityGuardRef.current) clearInterval(qualityGuardRef.current)
    qualityGuardRef.current = setInterval(() => {
      const player = playerRef.current
      if (!player || transitioningRef.current) return
      try {
        const current = player.getPlaybackQuality()
        // If we've dropped below hd720, push back to hd1080
        if (current !== 'hd1080' && current !== 'hd720') {
          forceHighQuality(player)
        }
      } catch (_) {}
    }, 5000)
  }, [])

  // ─── Loop guard: seek back before video ends ──────────────────────────────
  const startLoopGuard = useCallback(() => {
    if (loopGuardRef.current) clearInterval(loopGuardRef.current)
    loopGuardRef.current = setInterval(() => {
      const player = playerRef.current
      if (!player || transitioningRef.current) return
      try {
        if (player.getPlayerState() !== 1) return
        const current = player.getCurrentTime()
        const duration = player.getDuration()
        if (!duration || duration < 60) return
        if (duration - current < 25) {
          player.seekTo(Math.floor(Math.random() * duration * 0.35), true)
        }
      } catch (_) {}
    }, 3000)
  }, [])

  // ─── Advance to next video ────────────────────────────────────────────────
  const advanceVideo = useCallback(() => {
    if (transitioningRef.current) return
    transitioningRef.current = true
    showPreloader()
    if (loopGuardRef.current) clearInterval(loopGuardRef.current)
    if (qualityGuardRef.current) clearInterval(qualityGuardRef.current)

    const next = (indexRef.current + 1) % VIDEO_IDS.length
    indexRef.current = next
    setCurrentVideoIndex(next)

    setTimeout(() => {
      if (playerRef.current) {
        const id = VIDEO_IDS[next]
        const start = getRandomStartTime(id)
        // loadVideoById with suggestedQuality — strongest API-level hint
        playerRef.current.loadVideoById({
          videoId: id,
          startSeconds: start,
          suggestedQuality: 'hd1080',
        })
      }
      transitioningRef.current = false
    }, 400)
  }, [showPreloader, setCurrentVideoIndex])

  // ─── Player events ────────────────────────────────────────────────────────
  const onPlayerReady = useCallback((event: { target: YTPlayer }) => {
    forceHighQuality(event.target)
    event.target.playVideo()
  }, [])

  const onStateChange = useCallback(
    (event: { data: number }) => {
      if (!window.YT) return
      const { PlayerState } = window.YT

      if (event.data === PlayerState.PLAYING) {
        forceHighQuality(playerRef.current!)
        if (!transitioningRef.current) {
          if (!initialRevealDoneRef.current) {
            initialRevealDoneRef.current = true
          }
          hidePreloader()
          startLoopGuard()
          startQualityGuard()
        }
      }

      if (event.data === PlayerState.BUFFERING) {
        // Re-assert quality every time buffering starts
        try { forceHighQuality(playerRef.current!) } catch (_) {}
      }

      if (event.data === PlayerState.ENDED) advanceVideo()

      if (event.data === -1) {
        setTimeout(() => {
          try {
            const s = playerRef.current?.getPlayerState()
            if (s === -1 || s === 5) advanceVideo()
          } catch (_) {}
        }, 4000)
      }
    },
    [hidePreloader, advanceVideo, startLoopGuard, startQualityGuard]
  )

  const onError = useCallback(() => advanceVideo(), [advanceVideo])

  // ─── Init ─────────────────────────────────────────────────────────────────
  const initPlayer = useCallback(() => {
    if (!window.YT?.Player) return

    const startIndex = Math.floor(Math.random() * VIDEO_IDS.length)
    indexRef.current = startIndex
    setCurrentVideoIndex(startIndex)
    const startId = VIDEO_IDS[startIndex]
    const startTime = getRandomStartTime(startId)

    // Swap the iframe src to the quality-baked URL before creating the player
    if (iframeRef.current) {
      iframeRef.current.src = buildPlayerSrc(startId, startTime)
    }

    playerRef.current = new window.YT.Player('yt-bg', {
      videoId: startId,
      playerVars: {
        autoplay: 1,
        mute: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        loop: 0,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        showinfo: 0,
        enablejsapi: 1,
        start: startTime,
        vq: 'hd1080',
        hd: 1,
      },
      events: { onReady: onPlayerReady, onStateChange, onError },
    })
  }, [onPlayerReady, onStateChange, onError, setCurrentVideoIndex])

  useEffect(() => {
    if (window.YT?.Player) initPlayer()
    else window.onYouTubeIframeAPIReady = initPlayer
    return () => {
      if (loopGuardRef.current) clearInterval(loopGuardRef.current)
      if (qualityGuardRef.current) clearInterval(qualityGuardRef.current)
      try { playerRef.current?.destroy() } catch (_) {}
    }
  }, [initPlayer])

  return (
    <>
      <Script src="https://www.youtube.com/iframe_api" strategy="lazyOnload" />

      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          background: '#020205',
        }}
      >
        {/*
          Cover sizing: the iframe is always larger than the viewport in
          both dimensions so no letterboxing on any aspect ratio.
            width  = max(vw + chrome, vh × 16/9 + chrome)
            height = max(vh + chrome, vw × 9/16 + chrome)
          Centred with translate(-50%,-50%).
        */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 'max(calc(100vw + 60px), calc(100vh * 1.7778 + 60px))',
            height: 'max(calc(100vh + 180px), calc(100vw * 0.5625 + 180px))',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            id="yt-bg"
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </div>

        {/* Dim overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(2, 2, 5, 0.42)',
            zIndex: 1,
          }}
        />
      </div>
    </>
  )
}