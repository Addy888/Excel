import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Create Admin User
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {
        name: 'Admin User',
        password: adminPassword,
        roleName: 'admin',
      },
      create: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: adminPassword,
        roleName: 'admin',
      },
    });
    console.log('✅ Admin user created/updated');

    // Create Regular User
    const userPassword = await bcrypt.hash('user123', 10);
    const user = await prisma.user.upsert({
      where: { email: 'user@example.com' },
      update: {
        name: 'Regular User',
        password: userPassword,
        roleName: 'user',
      },
      create: {
        name: 'Regular User',
        email: 'user@example.com',
        password: userPassword,
        roleName: 'user',
      },
    });
    console.log('✅ Regular user created/updated');

    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('📧 Admin Login:');
    console.log('   Email: admin@example.com');
    console.log('   Password: Admin@123\n');
    console.log('📧 User Login:');
    console.log('   Email: user@example.com');
    console.log('   Password: user123\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

seedData();
