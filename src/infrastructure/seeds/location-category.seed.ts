import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationType } from '../../domain/locations/entities/location-type.entity';
import { HERE_CATEGORY_MAP } from '../../domain/locations/here-category-map';

@Injectable()
export class HereCategorySeeder implements OnModuleInit {
  constructor(
    @InjectRepository(LocationType)
    private readonly categoryRepo: Repository<LocationType>,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    for (const [code, { name, here_id }] of Object.entries(HERE_CATEGORY_MAP)) {
      const exists = await this.categoryRepo.findOne({ where: { here_id } });
      if (!exists) {
        const category = this.categoryRepo.create({
          code,
          name,
          here_id,
        });
        await this.categoryRepo.save(category);
      }
    }

    console.log('HERE categories seeded ✅');
  }
}
