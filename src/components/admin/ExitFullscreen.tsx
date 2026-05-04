'use client'

import { useEffect } from 'react'

export function ExitFullscreen() {
  useEffect(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
  }, [])
  return null
}
