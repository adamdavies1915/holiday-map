'use client'

import { House } from '@/lib/types'

interface HousePopupProps {
  house: House
  onVote: (houseId: string, value: 1 | -1) => void
  onDelete: (houseId: string) => void
}

export default function HousePopup({ house, onVote, onDelete }: HousePopupProps) {
  return (
    <div className="p-1">
      {/* Header */}
      <div className="flex items-start gap-2 mb-2">
        <span className="text-2xl">🎄</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-christmas-darkRed leading-tight">
            {house.name}
          </h3>
          {house.address && (
            <p className="text-sm text-gray-600 truncate">{house.address}</p>
          )}
        </div>
        {/* Delete button for owner */}
        {house.isOwner && (
          <button
            onClick={() => onDelete(house.id)}
            className="text-gray-400 hover:text-christmas-red transition-colors p-1"
            title="Delete this house"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Image */}
      {house.imagePath && (
        <div className="mb-3 rounded-lg overflow-hidden border-2 border-christmas-green/30">
          <img
            src={house.imagePath}
            alt={house.name}
            className="w-full h-40 object-cover"
          />
        </div>
      )}

      {/* Description */}
      {house.description && (
        <p className="text-sm text-gray-700 mb-3 line-clamp-3">
          {house.description}
        </p>
      )}

      {/* Voting */}
      <div className="flex items-center justify-between pt-2 border-t border-christmas-green/20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onVote(house.id, 1)}
            className={`vote-btn vote-btn-up ${
              house.userVote === 1 ? 'active' : ''
            }`}
            title="Upvote"
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <span
            className={`font-bold text-lg min-w-[2rem] text-center ${
              house.voteScore > 0
                ? 'text-christmas-green'
                : house.voteScore < 0
                ? 'text-christmas-red'
                : 'text-gray-500'
            }`}
          >
            {house.voteScore}
          </span>

          <button
            onClick={() => onVote(house.id, -1)}
            className={`vote-btn vote-btn-down ${
              house.userVote === -1 ? 'active' : ''
            }`}
            title="Downvote"
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="text-xs text-gray-500">
          Added {new Date(house.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}
