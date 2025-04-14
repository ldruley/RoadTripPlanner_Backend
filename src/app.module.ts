import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {TypeOrmModule, TypeOrmModuleOptions} from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TripsModule } from './trips/trips.module';
import { StintsModule } from './stints/stints.module';
import { StopsModule } from './stops/stops.module';
import { LegsModule } from './legs/legs.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { SuppliesModule } from './supplies/supplies.module';

import appConfig from './config/configuration';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) : TypeOrmModuleOptions => {
        const dbConfig = configService.get('database');
        return dbConfig as TypeOrmModuleOptions;
      },
    }),

    // Feature modules
    UsersModule,
    TripsModule,
    StintsModule,
    StopsModule,
    LegsModule,
    VehiclesModule,
    SuppliesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}