import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';
import { HereCategorySeeder } from '../seeds/location-category.seed';

async function resetDatabase() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('⛔ Dropping database...');
  await dataSource.dropDatabase();

  console.log('🛠 Re-synchronizing schema...');
  await dataSource.synchronize();

  console.log('🌱 Seeding HERE categories...');
  const seeder = app.get(HereCategorySeeder);
  await seeder.seed();

  await app.close();
  console.log('✅ Reset complete!');
}

resetDatabase().catch((err) => {
  console.error('❌ Error resetting database:', err);
  process.exit(1);
});
