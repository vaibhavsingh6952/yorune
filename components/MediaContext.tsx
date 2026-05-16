'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

interface MediaContextValue {
  isPreloaderVisible: boolean
  showPreloader: () => void
  hidePreloader: () => void
  currentVideoIndex: number
  setCurrentVideoIndex: (index: number) => void
  isVideoReady: boolean
  setIsVideoReady: (ready: boolean) => void
}

const MediaContext = createContext<MediaContextValue | null>(null)

export function MediaProvider({ children }: { children: React.ReactNode }) {
  const [isPreloaderVisible, setIsPreloaderVisible] = useState(true)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [isVideoReady, setIsVideoReady] = useState(false)

  const showPreloader = useCallback(() => {
    setIsPreloaderVisible(true)
    setIsVideoReady(false)
  }, [])

  const hidePreloader = useCallback(() => {
    setIsPreloaderVisible(false)
  }, [])

  return (
    <MediaContext.Provider
      value={{
        isPreloaderVisible,
        showPreloader,
        hidePreloader,
        currentVideoIndex,
        setCurrentVideoIndex,
        isVideoReady,
        setIsVideoReady,
      }}
    >
      {children}
    </MediaContext.Provider>
  )
}

export function useMedia(): MediaContextValue {
  const ctx = useContext(MediaContext)
  if (!ctx) throw new Error('useMedia must be used within MediaProvider')
  return ctx
}
