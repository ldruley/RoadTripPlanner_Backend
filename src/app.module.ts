import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './domain/users/users.module';
import { TripsModule } from './domain/trips/trips.module';
import { VehiclesModule } from './domain/vehicles/vehicles.module';
import { SuppliesModule } from './domain/supplies/supplies.module';
import { AuthModule } from './infrastructure/auth/auth.module';
import { HereApiModule } from './infrastructure/api/here-api/here-api.module';

import appConfig from './infrastructure/config/configuration';
import databaseConfig from './infrastructure/config/database.config';
import { ItineraryModule } from './domain/itinerary/itinerary.module';
import { LocationsModule } from './domain/locations/locations.module';

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
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const dbConfig = configService.get('database');
        return dbConfig as TypeOrmModuleOptions;
      },
    }),

    // Feature modules
    UsersModule,
    TripsModule,
    ItineraryModule,
    LocationsModule,
    VehiclesModule,
    SuppliesModule,
    AuthModule,
    HereApiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
