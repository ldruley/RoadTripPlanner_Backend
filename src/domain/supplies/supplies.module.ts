import { Module } from '@nestjs/common';
import { SuppliesController } from './supplies.controller';
import { SuppliesService } from './supplies.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supply } from './entities/supply.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Supply])],
  controllers: [SuppliesController],
  providers: [SuppliesService],
  exports: [SuppliesService],
})
export class SuppliesModule {}
