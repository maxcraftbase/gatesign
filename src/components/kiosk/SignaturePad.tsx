'use client'

import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'

export interface SignaturePadHandle {
  isEmpty: () => boolean
  toDataURL: () => string
  clear: () => void
}

interface SignaturePadProps {
  className?: string
  onSign?: () => void
}

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  function SignaturePad({ className, onSign }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const isDrawing = useRef(false)
    const hasDrawn = useRef(false)
    const lastX = useRef(0)
    const lastY = useRef(0)

    const getCtx = useCallback(() => {
      const canvas = canvasRef.current
      if (!canvas) return null
      return canvas.getContext('2d')
    }, [])

    const getPos = useCallback((e: PointerEvent, canvas: HTMLCanvasElement) => {
      const rect = canvas.getBoundingClientRect()
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }, [])

    const setupCanvas = useCallback(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.scale(dpr, dpr)
      ctx.strokeStyle = '#0F172A'
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }, [])

    useEffect(() => {
      setupCanvas()
      const canvas = canvasRef.current
      if (!canvas) return

      const onPointerDown = (e: PointerEvent) => {
        e.preventDefault()
        canvas.setPointerCapture(e.pointerId)
        isDrawing.current = true
        const pos = getPos(e, canvas)
        lastX.current = pos.x
        lastY.current = pos.y
        const ctx = getCtx()
        if (!ctx) return
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, 1.25, 0, Math.PI * 2)
        ctx.fillStyle = '#0F172A'
        ctx.fill()
      }

      const onPointerMove = (e: PointerEvent) => {
        if (!isDrawing.current) return
        e.preventDefault()
        const pos = getPos(e, canvas)
        const ctx = getCtx()
        if (!ctx) return
        ctx.beginPath()
        ctx.moveTo(lastX.current, lastY.current)
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()
        lastX.current = pos.x
        lastY.current = pos.y
        if (!hasDrawn.current) {
          hasDrawn.current = true
          onSign?.()
        }
      }

      const onPointerUp = (e: PointerEvent) => {
        if (!isDrawing.current) return
        e.preventDefault()
        isDrawing.current = false
      }

      canvas.addEventListener('pointerdown', onPointerDown, { passive: false })
      canvas.addEventListener('pointermove', onPointerMove, { passive: false })
      canvas.addEventListener('pointerup', onPointerUp, { passive: false })
      canvas.addEventListener('pointercancel', onPointerUp, { passive: false })

      return () => {
        canvas.removeEventListener('pointerdown', onPointerDown)
        canvas.removeEventListener('pointermove', onPointerMove)
        canvas.removeEventListener('pointerup', onPointerUp)
        canvas.removeEventListener('pointercancel', onPointerUp)
      }
    }, [getCtx, getPos, onSign, setupCanvas])

    useImperativeHandle(ref, () => ({
      isEmpty: () => !hasDrawn.current,
      toDataURL: () => canvasRef.current?.toDataURL('image/png') ?? '',
      clear: () => {
        const canvas = canvasRef.current
        const ctx = getCtx()
        if (!canvas || !ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        hasDrawn.current = false
      },
    }))

    return (
      <canvas
        ref={canvasRef}
        className={className}
        style={{ touchAction: 'none', cursor: 'crosshair' }}
      />
    )
  }
)
