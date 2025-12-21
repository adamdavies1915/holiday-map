export interface House {
  id: string
  name: string
  description: string | null
  address: string | null
  latitude: number
  longitude: number
  imagePath: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
  voteScore: number
  userVote: number | null // 1, -1, or null if not voted
  isOwner: boolean // true if the current user created this house
}

export interface CreateHouseInput {
  name: string
  description?: string
  address?: string
  latitude: number
  longitude: number
  imagePath?: string
}

export interface VoteInput {
  houseId: string
  browserId: string
  value: 1 | -1
}
