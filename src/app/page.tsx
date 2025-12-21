'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { House } from '@/lib/types'
import { getBrowserId } from '@/lib/browser-id'
import AddHouseModal from '@/components/AddHouseModal'
import Snowfall from '@/components/Snowfall'

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-800">
      <div className="text-christmas-gold text-xl animate-pulse">
        Loading map...
      </div>
    </div>
  ),
})

export default function Home() {
  const [houses, setHouses] = useState<House[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [browserId, setBrowserId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null)

  const fetchHouses = useCallback(async () => {
    try {
      const response = await fetch('/api/houses', {
        headers: {
          'x-browser-id': browserId,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setHouses(data)
      }
    } catch (error) {
      console.error('Error fetching houses:', error)
    } finally {
      setIsLoading(false)
    }
  }, [browserId])

  useEffect(() => {
    const id = getBrowserId()
    setBrowserId(id)
  }, [])

  useEffect(() => {
    if (browserId) {
      fetchHouses()
    }
  }, [browserId, fetchHouses])

  const handleHouseAdded = (newHouse: House) => {
    setHouses((prev) => [newHouse, ...prev])
    setIsModalOpen(false)
    setClickedCoords(null)
  }

  const handleMapClick = (lat: number, lng: number) => {
    setClickedCoords({ lat, lng })
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setClickedCoords(null)
  }

  const handleVote = async (houseId: string, value: 1 | -1) => {
    const house = houses.find((h) => h.id === houseId)
    if (!house) return

    // If clicking the same vote, remove it (value = 0)
    const newValue = house.userVote === value ? 0 : value

    try {
      const response = await fetch(`/api/houses/${houseId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          browserId,
          value: newValue,
        }),
      })

      if (response.ok) {
        const { voteScore, userVote } = await response.json()
        setHouses((prev) =>
          prev.map((h) =>
            h.id === houseId ? { ...h, voteScore, userVote } : h
          )
        )
      }
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  const handleDelete = async (houseId: string) => {
    if (!confirm('Are you sure you want to delete this house?')) {
      return
    }

    try {
      const response = await fetch(`/api/houses/${houseId}`, {
        method: 'DELETE',
        headers: {
          'x-browser-id': browserId,
        },
      })

      if (response.ok) {
        setHouses((prev) => prev.filter((h) => h.id !== houseId))
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete house')
      }
    } catch (error) {
      console.error('Error deleting house:', error)
      alert('Failed to delete house')
    }
  }

  return (
    <main className="h-screen w-full relative overflow-hidden">
      <Snowfall />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-[1000] bg-gradient-to-r from-christmas-red via-christmas-darkRed to-christmas-red p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎄</span>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-wide">
              NOLA Christmas Houses
            </h1>
            <span className="text-3xl">🏠</span>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-christmas-green flex items-center gap-2"
          >
            <span className="text-xl">➕</span>
            <span className="hidden sm:inline">Add House</span>
          </button>
        </div>
      </header>

      {/* Map Container */}
      <div className="w-full h-full pt-[72px]">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-slate-800">
            <div className="text-christmas-gold text-xl animate-pulse">
              Loading Christmas magic...
            </div>
          </div>
        ) : (
          <Map houses={houses} onVote={handleVote} onDelete={handleDelete} browserId={browserId} onMapClick={handleMapClick} />
        )}
      </div>

      {/* Stats Bar */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-christmas-gold/30">
        <div className="flex items-center gap-4 text-sm text-white">
          <span className="flex items-center gap-1">
            <span className="text-christmas-gold">🏠</span>
            <span className="font-semibold">{houses.length}</span> houses
          </span>
          <span className="text-christmas-gold">|</span>
          <span className="flex items-center gap-1">
            <span className="text-christmas-green">⬆️</span>
            <span className="font-semibold">
              {houses.reduce((sum, h) => sum + Math.max(0, h.voteScore), 0)}
            </span> upvotes
          </span>
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Press and hold on the map to add a house
        </div>
      </div>

      {/* Add House Modal */}
      <AddHouseModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onHouseAdded={handleHouseAdded}
        initialLatitude={clickedCoords?.lat}
        initialLongitude={clickedCoords?.lng}
        browserId={browserId}
      />
    </main>
  )
}
