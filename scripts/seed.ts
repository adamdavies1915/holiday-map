import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const addresses = [
  '21 Dove Street',
  '6574 Memphis Street',
  '2 Marconi Drive',
  '4736 Barnett Street',
  '4529 Transcontinental Drive',
  '3920 Green Acres Road',
  '5524 Yale Street',
  '248 Citrus Road',
  '4444 Chalfant',
  '6000 St. Charles',
  '4534 St Charles',
]

async function geocode(address: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
  const query = encodeURIComponent(`${address}, New Orleans, LA`)

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
    console.error(`Failed to geocode ${address}:`, error)
    return null
  }
}

async function seed() {
  console.log('🎄 Seeding Christmas houses...\n')

  for (const address of addresses) {
    console.log(`📍 Geocoding: ${address}`)

    // Rate limit to respect Nominatim's usage policy (1 req/sec)
    await new Promise(resolve => setTimeout(resolve, 1100))

    const location = await geocode(address)

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

  console.log('\n🏠 Seeding complete!')
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
