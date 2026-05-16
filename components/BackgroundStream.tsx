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
    loadVideoById: (videoId: string, startSeconds?: number) => void
    playVideo: () => void
    seekTo: (seconds: number, allowSeekAhead: boolean) => void
    getCurrentTime: () => number
    getDuration: () => number
    destroy: () => void
    getPlayerState: () => number
    setPlaybackQuality: (quality: string) => void
  }
}

function getRandomStartTime(videoId: string): number {
  const duration = VIDEO_DURATIONS[videoId] ?? 3600
  return Math.floor(Math.random() * duration * 0.4)
}

export default function BackgroundStream() {
  const { setCurrentVideoIndex, hidePreloader, showPreloader } = useMedia()

  const playerRef = useRef<YTPlayer | null>(null)
  const indexRef = useRef(0)
  const initialRevealDoneRef = useRef(false)
  const loopGuardRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const transitioningRef = useRef(false)

  // ─── Loop guard: seek back before video ends to avoid black frame ─────────
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
    const next = (indexRef.current + 1) % VIDEO_IDS.length
    indexRef.current = next
    setCurrentVideoIndex(next)
    setTimeout(() => {
      if (playerRef.current) {
        const id = VIDEO_IDS[next]
        playerRef.current.loadVideoById(id, getRandomStartTime(id))
      }
      transitioningRef.current = false
    }, 400)
  }, [showPreloader, setCurrentVideoIndex])

  // ─── Player events ────────────────────────────────────────────────────────
  const onPlayerReady = useCallback((event: { target: YTPlayer }) => {
    // Force highest quality immediately on ready
    try { event.target.setPlaybackQuality('hd1080') } catch (_) {}
    event.target.playVideo()
  }, [])

  const onStateChange = useCallback(
    (event: { data: number }) => {
      if (!window.YT) return
      const { PlayerState } = window.YT

      if (event.data === PlayerState.PLAYING) {
        // Force quality every time playback starts (YT resets it on seeks)
        try { playerRef.current?.setPlaybackQuality('hd1080') } catch (_) {}

        if (!transitioningRef.current) {
          if (!initialRevealDoneRef.current) {
            initialRevealDoneRef.current = true
          }
          hidePreloader()
          startLoopGuard()
        }
      }

      if (event.data === PlayerState.ENDED) advanceVideo()

      // Unstarted after load — give 4 s then skip
      if (event.data === -1) {
        setTimeout(() => {
          try {
            const s = playerRef.current?.getPlayerState()
            if (s === -1 || s === 5) advanceVideo()
          } catch (_) {}
        }, 4000)
      }
    },
    [hidePreloader, advanceVideo, startLoopGuard]
  )

  const onError = useCallback(() => advanceVideo(), [advanceVideo])

  // ─── Init ─────────────────────────────────────────────────────────────────
  const initPlayer = useCallback(() => {
    if (!window.YT?.Player) return
    const startIndex = Math.floor(Math.random() * VIDEO_IDS.length)
    indexRef.current = startIndex
    setCurrentVideoIndex(startIndex)
    const startId = VIDEO_IDS[startIndex]

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
        start: getRandomStartTime(startId),
        // Request highest quality — YouTube still decides final delivery
        // but this hints to start at 1080p if bandwidth allows
        vq: 'hd1080',
      },
      events: { onReady: onPlayerReady, onStateChange, onError },
    })
  }, [onPlayerReady, onStateChange, onError, setCurrentVideoIndex])

  useEffect(() => {
    if (window.YT?.Player) initPlayer()
    else window.onYouTubeIframeAPIReady = initPlayer
    return () => {
      if (loopGuardRef.current) clearInterval(loopGuardRef.current)
      try { playerRef.current?.destroy() } catch (_) {}
    }
  }, [initPlayer])

  return (
    <>
      <Script src="https://www.youtube.com/iframe_api" strategy="lazyOnload" />

      {/* ── Viewport clip ── */}
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
          ── Cover sizing ──────────────────────────────────────────────────
          YouTube iframes are 16:9. On a wider-than-16:9 screen the iframe
          fills width but leaves bars top/bottom. On a narrower screen it
          fills height but leaves bars left/right.

          Solution: size the inner container to ALWAYS be at least:
            • as wide as viewport height × (16/9)   → fills tall screens
            • as tall as viewport width  × (9/16)   → fills wide screens
          Then centre it with translate(-50%,-50%) so the crop is symmetric.

          The extra ±90px top/bottom and ±30px left/right hide YT chrome.
        ──────────────────────────────────────────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            /*
              We need:
                width  = max(viewportWidth  + 60px,  viewportHeight × 16/9 + chrome)
                height = max(viewportHeight + 180px, viewportWidth  × 9/16 + chrome)
              Using CSS max() with viewport units:
            */
            width:  'max(calc(100vw + 60px),  calc(100vh * 1.7778 + 60px))',
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