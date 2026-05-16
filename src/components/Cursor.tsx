'use client'
import { useEffect, useRef } from 'react'

export default function Cursor() {
  const outerRef = useRef<HTMLDivElement>(null)
  const dotRef   = useRef<HTMLDivElement>(null)
  const pos       = useRef({ x: 0, y: 0 })
  const outerPos  = useRef({ x: 0, y: 0 })
  const rafRef    = useRef<number>()

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY }
      if (dotRef.current) {
        dotRef.current.style.left = e.clientX + 'px'
        dotRef.current.style.top  = e.clientY + 'px'
      }
    }

    const onDown = () => document.body.classList.add('cursor-click')
    const onUp   = () => document.body.classList.remove('cursor-click')

    const onOver = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      if (el.closest('a,button,[role="button"],input,select,textarea,label,.card'))
        document.body.classList.add('cursor-hover')
      else
        document.body.classList.remove('cursor-hover')
    }

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    const tick = () => {
      outerPos.current.x = lerp(outerPos.current.x, pos.current.x, 0.14)
      outerPos.current.y = lerp(outerPos.current.y, pos.current.y, 0.14)
      if (outerRef.current) {
        outerRef.current.style.left = outerPos.current.x + 'px'
        outerRef.current.style.top  = outerPos.current.y + 'px'
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseover', onOver)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <>
      <div id="cursor-outer" ref={outerRef} />
      <div id="cursor-dot"   ref={dotRef}   />
    </>
  )
}
