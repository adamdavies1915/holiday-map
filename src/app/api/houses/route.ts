import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const browserId = request.headers.get('x-browser-id') || ''

    const houses = await prisma.house.findMany({
      include: {
        votes: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const HIDE_THRESHOLD = -3 // Hide houses with 3+ downvotes

    const housesWithScores = houses.map((house) => {
      const voteScore = house.votes.reduce((sum, vote) => sum + vote.value, 0)
      const userVote = house.votes.find((v) => v.browserId === browserId)?.value ?? null
      const isOwner = browserId ? house.createdBy === browserId : false

      return {
        id: house.id,
        name: house.name,
        description: house.description,
        address: house.address,
        latitude: house.latitude,
        longitude: house.longitude,
        imagePath: house.imagePath,
        createdBy: house.createdBy,
        createdAt: house.createdAt.toISOString(),
        updatedAt: house.updatedAt.toISOString(),
        voteScore,
        userVote,
        isOwner,
      }
    })

    // Filter out houses with too many downvotes (but owners can still see their own)
    const visibleHouses = housesWithScores.filter(
      (house) => house.voteScore > HIDE_THRESHOLD || house.isOwner
    )

    return NextResponse.json(visibleHouses)
  } catch (error) {
    console.error('Error fetching houses:', error)
    return NextResponse.json({ error: 'Failed to fetch houses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const browserId = request.headers.get('x-browser-id') || null
    const body = await request.json()
    const { name, description, address, latitude, longitude, imagePath } = body

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    // Use name if provided, otherwise fall back to address, or coordinates
    const houseName = name?.trim() || address?.trim() || `House at ${parseFloat(latitude).toFixed(4)}, ${parseFloat(longitude).toFixed(4)}`

    const house = await prisma.house.create({
      data: {
        name: houseName,
        description: description || null,
        address: address || null,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        imagePath: imagePath || null,
        createdBy: browserId,
      },
    })

    return NextResponse.json({
      ...house,
      createdAt: house.createdAt.toISOString(),
      updatedAt: house.updatedAt.toISOString(),
      voteScore: 0,
      userVote: null,
      isOwner: true,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating house:', error)
    return NextResponse.json({ error: 'Failed to create house' }, { status: 500 })
  }
}
