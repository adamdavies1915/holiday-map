import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: houseId } = params
    const body = await request.json()
    const { browserId, value } = body

    if (!browserId) {
      return NextResponse.json({ error: 'Browser ID is required' }, { status: 400 })
    }

    if (value !== 1 && value !== -1 && value !== 0) {
      return NextResponse.json({ error: 'Vote value must be 1, -1, or 0' }, { status: 400 })
    }

    // Check if house exists
    const house = await prisma.house.findUnique({
      where: { id: houseId },
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    // If value is 0, remove the vote
    if (value === 0) {
      await prisma.vote.deleteMany({
        where: {
          houseId,
          browserId,
        },
      })
    } else {
      // Upsert the vote
      await prisma.vote.upsert({
        where: {
          houseId_browserId: {
            houseId,
            browserId,
          },
        },
        update: {
          value,
        },
        create: {
          houseId,
          browserId,
          value,
        },
      })
    }

    // Get updated vote score
    const votes = await prisma.vote.findMany({
      where: { houseId },
    })

    const voteScore = votes.reduce((sum, vote) => sum + vote.value, 0)
    const userVote = votes.find((v) => v.browserId === browserId)?.value ?? null

    return NextResponse.json({ voteScore, userVote })
  } catch (error) {
    console.error('Error voting:', error)
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 })
  }
}
