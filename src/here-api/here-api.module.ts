import { Module } from '@nestjs/common';
import { HereApiService } from './here-api.service';
import { HereApiController } from './here-api.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [ConfigModule],
    controllers: [HereApiController],
    providers: [HereApiService],
    exports: [HereApiService]
})
export class HereApiModule {}