import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({
  url: 'file:./dev.db',
})

const prisma = new PrismaClient({ adapter })

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'demo@smartaccess.app' },
    update: {
      fullName: 'Demo Owner',
    },
    create: {
      fullName: 'Demo Owner',
      email: 'demo@smartaccess.app',
    },
  })

  const existingProperty = await prisma.property.findFirst({
    where: {
      name: 'Benalmádena Suites',
      userId: user.id,
    },
  })

  const property =
    existingProperty ??
    (await prisma.property.create({
      data: {
        name: 'Benalmádena Suites',
        address: 'Av. del Sol 123',
        city: 'Benalmádena',
        country: 'España',
        userId: user.id,
      },
    }))

  const existingUnit = await prisma.unit.findFirst({
    where: {
      name: 'Apartamento 1A',
      propertyId: property.id,
    },
  })

  const unit =
    existingUnit ??
    (await prisma.unit.create({
      data: {
        name: 'Apartamento 1A',
        description: 'Estudio con acceso inteligente',
        maxGuests: 2,
        propertyId: property.id,
      },
    }))

  const existingGuest = await prisma.guest.findFirst({
    where: { email: 'juan@example.com' },
  })

  const guest =
    existingGuest ??
    (await prisma.guest.create({
      data: {
        fullName: 'Juan Pérez',
        email: 'juan@example.com',
        phone: '+34600111222',
        documentId: 'X1234567A',
      },
    }))

  const existingBooking = await prisma.booking.findUnique({
    where: { reference: 'BK-1001' },
  })

  if (!existingBooking) {
    await prisma.booking.create({
      data: {
        reference: 'BK-1001',
        checkInDate: new Date('2026-04-10T15:00:00.000Z'),
        checkOutDate: new Date('2026-04-15T11:00:00.000Z'),
        status: 'CONFIRMED',
        guestCount: 2,
        notes: 'Llegada estimada 18:00',
        unitId: unit.id,
        guestId: guest.id,
      },
    })
  }

  console.log('Seed ejecutado correctamente')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })