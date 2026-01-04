// prisma/seed.ts
import {
  PrismaClient,
  Category,
  UserRole,
  OrderStatus,
  DiningType,
  PaymentMethod,
} from "@/generated/prisma";
import { hashPassword, generateSalt } from "@/lib/auth/passwordHasher";

// Gunakan DIRECT_URL saat seed agar tidak lewat pgBouncer
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    },
  },
});

// Helper functions
function subDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0); // normalisasi ke awal hari (opsional, membantu konsistensi serviceDate)
  d.setDate(d.getDate() - days);
  return d;
}

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log("Seeding database (PostgreSQL/Supabase)...");

  // 1. Admin User
  const adminSalt = generateSalt();
  const adminPassword = await hashPassword("asdasdasd", adminSalt);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@gmail.com",
      password: adminPassword,
      salt: adminSalt,
      role: UserRole.admin,
      emailVerified: new Date(),
    },
  });
  console.log(`✅ Admin user ready: ${adminUser.email}`);

  // 2. Customer Users
  const CUSTOMERS = [
    { name: "Andi Wijaya", email: "andi.wijaya@example.com" },
    { name: "Budi Santoso", email: "budi.santoso@example.com" },
    { name: "Citra Lestari", email: "citra.lestari@example.com" },
    { name: "Dewi Anggraini", email: "dewi.anggraini@example.com" },
    { name: "Eko Prasetyo", email: "eko.prasetyo@example.com" },
  ];

  console.log("Seeding customers...");
  for (const c of CUSTOMERS) {
    const salt = generateSalt();
    const pwd = await hashPassword("asdasdasd", salt);
    await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        ...c,
        password: pwd,
        salt,
        role: UserRole.user,
        emailVerified: new Date(),
      },
    });
  }
  console.log(`✅ ${CUSTOMERS.length} customers ready`);

  // 3. Products
  const MENU_ITEMS = [
    {
      name: "Caesar Salad",
      category: Category.APPETIZER,
      price: 45000,
      imageUrl:
        "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&auto=format&fit=crop",
      stock: 20,
    },
    {
      name: "Grilled Salmon",
      category: Category.MAIN,
      price: 89000,
      imageUrl:
        "https://images.unsplash.com/photo-1604908176997-3bb3f1b3a3ff?w=600&auto=format&fit=crop",
      stock: 15,
    },
    {
      name: "Margherita Pizza",
      category: Category.MAIN,
      price: 65000,
      imageUrl:
        "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&auto=format&fit=crop",
      stock: 30,
    },
    {
      name: "Iced Coffee",
      category: Category.DRINK,
      price: 25000,
      imageUrl:
        "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&auto=format&fit=crop",
      stock: 50,
    },
    {
      name: "Fruit Smoothie",
      category: Category.DRINK,
      price: 30000,
      imageUrl:
        "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&auto=format&fit=crop",
      stock: 25,
    },
    {
      name: "Nasi Goreng Spesial",
      category: Category.MAIN,
      price: 55000,
      imageUrl:
        "https://images.unsplash.com/photo-1598515598522-25b4b830d937?w=600&auto=format&fit=crop",
      stock: 40,
    },
    {
      name: "Lemon Tea",
      category: Category.DRINK,
      price: 20000,
      imageUrl:
        "https://images.unsplash.com/photo-1575488433146-2d5dcf5b28c3?w=600&auto=format&fit=crop",
      stock: 60,
    },
  ] as const;

  // createMany aman di Postgres. Jika ingin idempotent, cek yang sudah ada dulu:
  const existing = await prisma.product.findMany({
    where: { name: { in: MENU_ITEMS.map((m) => m.name) } },
    select: { name: true },
  });
  const existingSet = new Set(existing.map((e) => e.name));
  const toCreate = MENU_ITEMS.filter((m) => !existingSet.has(m.name));

  if (toCreate.length) {
    await prisma.product.createMany({
      data: toCreate.map((m) => ({ ...m, isActive: true })),
      // skipDuplicates: true, // opsional (Postgres mendukung), bila ingin tanpa cek manual
    });
    console.log(`✅ Products seeded: ${toCreate.length}`);
  } else {
    console.log("ℹ️ All products already exist, skip.");
  }

  // 4. Sales (Orders + Items + Payments)
  console.log("Seeding orders...");
  const existingOrdersCount = await prisma.order.count();
  if (existingOrdersCount > 0) {
    console.log("ℹ️ Orders exist. Skipping sales seeding.");
  } else {
    const customers = await prisma.user.findMany({
      where: { role: UserRole.user },
      select: { id: true },
    });
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, price: true },
    });
    if (customers.length === 0 || products.length === 0) {
      console.warn("⚠️ Need customers & products to seed orders. Skipped.");
      return;
    }

    let orderCount = 0;
    const DAYS_TO_SEED = 30;

    for (let i = 0; i < DAYS_TO_SEED; i++) {
      const date = subDays(new Date(), i);
      const ordersPerDay = getRandomNumber(2, 10);

      for (let j = 0; j < ordersPerDay; j++) {
        const customerId = getRandomElement(customers).id;
        const pickedProducts = Array.from(
          { length: getRandomNumber(1, 4) },
          () => getRandomElement(products)
        );

        const orderItems = pickedProducts.map((p) => {
          const qty = getRandomNumber(1, 2);
          return {
            productId: p.id,
            qty,
            price: p.price,
            total: p.price * qty,
          };
        });

        const subtotal = orderItems.reduce((acc, it) => acc + it.total, 0);
        const tax = Math.round(subtotal * 0.11);
        const total = subtotal + tax;

        // 80% PAID, 10% CANCELLED, 10% AWAITING
        const r = Math.random();
        const status =
          r < 0.8
            ? OrderStatus.PAID
            : r < 0.9
            ? OrderStatus.CANCELLED
            : OrderStatus.AWAITING_PAYMENT;

        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
        const orderCode = `ORD-${dateStr}-${String(1000 + orderCount)}`;
        const queueNumber = String(j + 1);

        // 1 transaksi per order untuk menjaga koneksi tetap rendah
        await prisma.$transaction(async (tx) => {
          await tx.order.create({
            data: {
              code: orderCode,
              queueNumber,
              serviceDate: date,
              createdAt: date,
              status,
              diningType: getRandomElement([
                DiningType.DINE_IN,
                DiningType.TAKE_AWAY,
              ]),
              subtotal,
              tax,
              total,
              customerId,
              items: { create: orderItems },
              payments:
                status === OrderStatus.PAID
                  ? {
                      create: {
                        method: getRandomElement([
                          PaymentMethod.CASH,
                          PaymentMethod.QRIS,
                          PaymentMethod.CARD,
                        ]),
                        amount: total,
                        paidAt: date,
                      },
                    }
                  : undefined,
            },
          });
        });

        orderCount++;
      }
    }

    console.log(`✅ Seeded ${orderCount} orders over ${DAYS_TO_SEED} days.`);
  }

  console.log("🎉 Seeding complete (PostgreSQL).");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
