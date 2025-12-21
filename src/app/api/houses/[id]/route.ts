import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: houseId } = params
    const browserId = request.headers.get('x-browser-id')

    if (!browserId) {
      return NextResponse.json({ error: 'Browser ID is required' }, { status: 400 })
    }

    // Find the house
    const house = await prisma.house.findUnique({
      where: { id: houseId },
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    // Check if the user is the owner
    if (house.createdBy !== browserId) {
      return NextResponse.json(
        { error: 'You can only delete houses you created' },
        { status: 403 }
      )
    }

    // Delete the house (votes will cascade delete)
    await prisma.house.delete({
      where: { id: houseId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting house:', error)
    return NextResponse.json({ error: 'Failed to delete house' }, { status: 500 })
  }
}
