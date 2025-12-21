'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { House } from '@/lib/types'

// Helper function for reverse geocoding
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: {
          'User-Agent': 'NOLA Christmas Map',
        },
      }
    )
    const data = await response.json()
    if (data.display_name) {
      return data.display_name.split(',').slice(0, 3).join(',')
    }
    return null
  } catch {
    return null
  }
}

interface AddHouseModalProps {
  isOpen: boolean
  onClose: () => void
  onHouseAdded: (house: House) => void
  initialLatitude?: number
  initialLongitude?: number
  browserId?: string
}

export default function AddHouseModal({
  isOpen,
  onClose,
  onHouseAdded,
  initialLatitude,
  initialLongitude,
  browserId,
}: AddHouseModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Set initial coordinates and reverse geocode when modal opens with coordinates (from map click)
  useEffect(() => {
    if (isOpen && initialLatitude !== undefined && initialLongitude !== undefined) {
      setLatitude(initialLatitude.toFixed(6))
      setLongitude(initialLongitude.toFixed(6))

      // Reverse geocode to get address
      setIsGeocoding(true)
      reverseGeocode(initialLatitude, initialLongitude).then((addr) => {
        if (addr) {
          setAddress(addr)
        }
        setIsGeocoding(false)
      })
    }
  }, [isOpen, initialLatitude, initialLongitude])

  const resetForm = () => {
    setName('')
    setDescription('')
    setAddress('')
    setLatitude('')
    setLongitude('')
    setImageFile(null)
    setImagePreview(null)
    setError('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB')
        return
      }
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setError('')
    }
  }

  const handleGeocode = async () => {
    if (!address.trim()) {
      setError('Please enter an address to geocode')
      return
    }

    setIsGeocoding(true)
    setError('')

    try {
      // Use Nominatim for geocoding (free, no API key needed)
      const query = encodeURIComponent(`${address}, New Orleans, LA`)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
        {
          headers: {
            'User-Agent': 'NOLA Christmas Map',
          },
        }
      )

      const data = await response.json()

      if (data.length > 0) {
        setLatitude(data[0].lat)
        setLongitude(data[0].lon)
        if (data[0].display_name) {
          setAddress(data[0].display_name.split(',').slice(0, 3).join(','))
        }
      } else {
        setError('Address not found. Please try a more specific address or enter coordinates manually.')
      }
    } catch (err) {
      setError('Failed to geocode address. Please try again or enter coordinates manually.')
    } finally {
      setIsGeocoding(false)
    }
  }

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setIsLocating(true)
    setError('')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude

        setLatitude(lat.toFixed(6))
        setLongitude(lng.toFixed(6))

        // Try to reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            {
              headers: {
                'User-Agent': 'NOLA Christmas Map',
              },
            }
          )
          const data = await response.json()
          if (data.display_name) {
            setAddress(data.display_name.split(',').slice(0, 3).join(','))
          }
        } catch (err) {
          // Ignore reverse geocoding errors, we still have the coordinates
        }

        setIsLocating(false)
      },
      (err) => {
        setIsLocating(false)
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location permission denied. Please enable location access.')
            break
          case err.POSITION_UNAVAILABLE:
            setError('Location unavailable. Please try again or enter address manually.')
            break
          case err.TIMEOUT:
            setError('Location request timed out. Please try again.')
            break
          default:
            setError('Failed to get location. Please try again or enter address manually.')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!latitude || !longitude) {
      setError('Please enter coordinates or use an address to get them')
      return
    }

    const lat = parseFloat(latitude)
    const lng = parseFloat(longitude)

    if (isNaN(lat) || isNaN(lng)) {
      setError('Invalid coordinates')
      return
    }

    // Rough bounds check for New Orleans metro area
    if (lat < 29.5 || lat > 30.5 || lng < -91 || lng > -89) {
      setError('Coordinates should be within the New Orleans metro area')
      return
    }

    setIsSubmitting(true)

    try {
      let imagePath = null

      // Upload image if selected
      if (imageFile) {
        const formData = new FormData()
        formData.append('file', imageFile)

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json()
          throw new Error(uploadError.error || 'Failed to upload image')
        }

        const uploadData = await uploadResponse.json()
        imagePath = uploadData.imagePath
      }

      // Create house
      const response = await fetch('/api/houses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-browser-id': browserId || '',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          address: address.trim() || null,
          latitude: lat,
          longitude: lng,
          imagePath,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add house')
      }

      const newHouse = await response.json()
      onHouseAdded(newHouse)
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add house')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-gradient-to-b from-christmas-cream to-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border-4 border-christmas-green">
        {/* Header */}
        <div className="sticky top-0 bg-christmas-red text-white p-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏠</span>
              <h2 className="text-xl font-bold">Add Christmas House</h2>
              <span className="text-2xl">🎄</span>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-christmas-darkGreen mb-1">
              House Name <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Uses address if left blank"
              className="w-full px-4 py-2 border-2 border-christmas-green/30 rounded-lg focus:border-christmas-green focus:outline-none"
              maxLength={255}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-christmas-darkGreen mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What makes this display special?"
              rows={3}
              className="w-full px-4 py-2 border-2 border-christmas-green/30 rounded-lg focus:border-christmas-green focus:outline-none resize-none"
            />
          </div>

          {/* Address with Geocode */}
          <div>
            <label className="block text-sm font-semibold text-christmas-darkGreen mb-1">
              Address {isGeocoding && <span className="text-gray-400 text-xs">(looking up...)</span>}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={isGeocoding ? "Looking up address..." : "123 Main St, Metairie"}
                className="flex-1 px-4 py-2 border-2 border-christmas-green/30 rounded-lg focus:border-christmas-green focus:outline-none"
                disabled={isGeocoding}
              />
              <button
                type="button"
                onClick={handleGeocode}
                disabled={isGeocoding}
                className="btn-christmas-green whitespace-nowrap disabled:opacity-50"
              >
                {isGeocoding ? '...' : '📍 Find'}
              </button>
            </div>
          </div>

          {/* Use My Location Button */}
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={isLocating}
            className="w-full btn-christmas-green py-3 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLocating ? (
              <>
                <span className="animate-pulse">📡</span>
                Getting location...
              </>
            ) : (
              <>
                <span>📍</span>
                Use My Current Location
              </>
            )}
          </button>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-christmas-darkGreen mb-1">
                Latitude *
              </label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="29.9511"
                className="w-full px-4 py-2 border-2 border-christmas-green/30 rounded-lg focus:border-christmas-green focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-christmas-darkGreen mb-1">
                Longitude *
              </label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="-90.0715"
                className="w-full px-4 py-2 border-2 border-christmas-green/30 rounded-lg focus:border-christmas-green focus:outline-none"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-christmas-darkGreen mb-1">
              Photo
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleImageChange}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-christmas-green/30 rounded-lg p-4 text-center cursor-pointer hover:border-christmas-green transition-colors"
            >
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setImageFile(null)
                      setImagePreview(null)
                    }}
                    className="absolute top-2 right-2 bg-christmas-red text-white rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="text-gray-500">
                  <span className="text-3xl">📷</span>
                  <p className="mt-2">Click to upload a photo</p>
                  <p className="text-xs">Max 5MB • JPG, PNG, WebP, GIF</p>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 btn-christmas-red py-3 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">🎄</span>
                  Adding...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>🏠</span>
                  Add House
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
