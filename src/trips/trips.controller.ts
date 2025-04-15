import {Body, Controller, Get, Param, Post, Put} from '@nestjs/common';
import {TripsService} from "./trips.service";
import {UpdateTripDto} from "./dto/update-trip-dto";

@Controller('trips')
export class TripsController {

    constructor(private readonly tripsService: TripsService) {}

    @Post()
    create(@Body() createTripDto: any) {
        return this.tripsService.create(createTripDto);
    }

    @Get(':id')
    findOne(@Param('id') id: number) {
        return this.tripsService.findOne(id);
    }

    @Put(':id')
    update(@Param ('id') id: number, @Param ('userId') userId: number, @Body() updateTripDto: Partial<UpdateTripDto>) {
        return this.tripsService.update(id, updateTripDto, userId);
    }

    @Delete
}
