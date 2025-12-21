import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Failed addresses with alternative search terms
const addresses = [
  { address: '4736 Barnett Street', search: '4736 Barnett Street, Metairie, LA' },
  { address: '4529 Transcontinental Drive', search: '4529 Transcontinental Drive, Metairie, LA' },
  { address: '3920 Green Acres Road', search: '3920 Green Acres Road, Metairie, LA' },
  { address: '5524 Yale Street', search: '5524 Yale Street, Metairie, LA' },
  { address: '248 Citrus Road', search: '248 Citrus Road, Jefferson, LA' },
]

async function geocode(searchQuery: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
  const query = encodeURIComponent(searchQuery)

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
      {
        headers: {
          'User-Agent': 'NOLA Christmas Map Seeder',
        },
      }
    )

    const data = await response.json()

    if (data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name.split(',').slice(0, 3).join(','),
      }
    }
    return null
  } catch (error) {
    console.error(`Failed to geocode:`, error)
    return null
  }
}

async function seed() {
  console.log('🎄 Retrying failed addresses...\n')

  for (const { address, search } of addresses) {
    console.log(`📍 Geocoding: ${address}`)
    console.log(`   Search: ${search}`)

    // Rate limit to respect Nominatim's usage policy (1 req/sec)
    await new Promise(resolve => setTimeout(resolve, 1500))

    const location = await geocode(search)

    if (location) {
      const house = await prisma.house.create({
        data: {
          name: address,
          address: location.displayName,
          latitude: location.lat,
          longitude: location.lng,
          description: null,
          imagePath: null,
        },
      })
      console.log(`   ✅ Added: ${house.name} (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`)
    } else {
      console.log(`   ❌ Failed to geocode: ${address}`)
    }
  }

  console.log('\n🏠 Retry complete!')
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
