'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { House } from '@/lib/types'
import HousePopup from './HousePopup'
import { useEffect, useState, useRef, useCallback } from 'react'

// New Orleans center coordinates
const NEW_ORLEANS_CENTER: [number, number] = [29.9511, -90.0715]
const DEFAULT_ZOOM = 11

// Create a custom Christmas house icon
const createChristmasIcon = (voteScore: number) => {
  const size = Math.min(40, Math.max(25, 25 + voteScore * 2))

  return L.divIcon({
    className: 'christmas-house-marker',
    html: `
      <div style="
        font-size: ${size}px;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
        cursor: pointer;
        transition: transform 0.2s;
      " class="hover:scale-110">
        🏠
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  })
}

interface MapProps {
  houses: House[]
  onVote: (houseId: string, value: 1 | -1) => void
  onDelete: (houseId: string) => void
  browserId: string
  onMapClick?: (lat: number, lng: number) => void
}

function MapController() {
  const map = useMap()

  useEffect(() => {
    // Invalidate size after mount to fix any rendering issues
    setTimeout(() => {
      map.invalidateSize()
    }, 100)
  }, [map])

  return null
}

const LONG_PRESS_DURATION = 600 // ms

// Create a pulsing indicator icon for long press
const createPulsingIcon = () => {
  return L.divIcon({
    className: 'long-press-indicator',
    html: `
      <div style="
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: rgba(34, 139, 34, 0.3);
        border: 3px solid #228b22;
        animation: pulse-ring 0.6s ease-out forwards;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="font-size: 24px;">🏠</span>
      </div>
    `,
    iconSize: [50, 50],
    iconAnchor: [25, 25],
  })
}

function LongPressHandler({
  onLongPress,
  pressPosition,
  setPressPosition,
}: {
  onLongPress?: (lat: number, lng: number) => void
  pressPosition: { lat: number; lng: number } | null
  setPressPosition: (pos: { lat: number; lng: number } | null) => void
}) {
  const map = useMap()
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setPressPosition(null)
    startPosRef.current = null
  }, [setPressPosition])

  useMapEvents({
    mousedown: (e) => {
      // Ignore if clicking on a marker or popup
      if ((e.originalEvent.target as HTMLElement).closest('.leaflet-marker-icon, .leaflet-popup')) {
        return
      }

      startPosRef.current = { x: e.originalEvent.clientX, y: e.originalEvent.clientY }
      setPressPosition({ lat: e.latlng.lat, lng: e.latlng.lng })

      timerRef.current = setTimeout(() => {
        if (onLongPress && startPosRef.current) {
          onLongPress(e.latlng.lat, e.latlng.lng)
        }
        clearTimer()
      }, LONG_PRESS_DURATION)
    },
    mouseup: clearTimer,
    mousemove: (e) => {
      // Cancel if moved more than 10px
      if (startPosRef.current && timerRef.current) {
        const dx = e.originalEvent.clientX - startPosRef.current.x
        const dy = e.originalEvent.clientY - startPosRef.current.y
        if (Math.sqrt(dx * dx + dy * dy) > 10) {
          clearTimer()
        }
      }
    },
    // Touch events for mobile
    touchstart: (e) => {
      if ((e.originalEvent.target as HTMLElement).closest('.leaflet-marker-icon, .leaflet-popup')) {
        return
      }

      const touch = e.originalEvent.touches[0]
      startPosRef.current = { x: touch.clientX, y: touch.clientY }
      setPressPosition({ lat: e.latlng.lat, lng: e.latlng.lng })

      timerRef.current = setTimeout(() => {
        if (onLongPress && startPosRef.current) {
          // Vibrate on mobile if supported
          if (navigator.vibrate) {
            navigator.vibrate(50)
          }
          onLongPress(e.latlng.lat, e.latlng.lng)
        }
        clearTimer()
      }, LONG_PRESS_DURATION)
    },
    touchend: clearTimer,
    touchmove: (e) => {
      if (startPosRef.current && timerRef.current) {
        const touch = e.originalEvent.touches[0]
        const dx = touch.clientX - startPosRef.current.x
        const dy = touch.clientY - startPosRef.current.y
        if (Math.sqrt(dx * dx + dy * dy) > 10) {
          clearTimer()
        }
      }
    },
  })

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return null
}

export default function Map({ houses, onVote, onDelete, browserId, onMapClick }: MapProps) {
  const [mounted, setMounted] = useState(false)
  const [pressPosition, setPressPosition] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <MapContainer
      center={NEW_ORLEANS_CENTER}
      zoom={DEFAULT_ZOOM}
      className="w-full h-full"
      style={{ height: '100%', width: '100%' }}
    >
      <MapController />
      <LongPressHandler
        onLongPress={onMapClick}
        pressPosition={pressPosition}
        setPressPosition={setPressPosition}
      />

      {/* Long press indicator */}
      {pressPosition && (
        <Marker
          position={[pressPosition.lat, pressPosition.lng]}
          icon={createPulsingIcon()}
          interactive={false}
        />
      )}

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {houses.map((house) => (
        <Marker
          key={house.id}
          position={[house.latitude, house.longitude]}
          icon={createChristmasIcon(house.voteScore)}
        >
          <Popup maxWidth={320} minWidth={280}>
            <HousePopup house={house} onVote={onVote} onDelete={onDelete} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
