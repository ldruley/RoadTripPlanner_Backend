import {Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards} from '@nestjs/common';
import {JwtAuthGuard} from "../auth/guards/jwt-auth-guard";
import {ApiBearerAuth, ApiOperation, ApiResponse} from "@nestjs/swagger";
import {CreateStintDto} from "./dto/create-stint-dto";
import {GetUser} from "../auth/decorators/get-user-decorator";
import {User} from "../users/entities/user.entity";
import {StintsService} from "./stints.service";
import {CreateStintWithStopDto} from "./dto/create-stint-with-stop.dto";

@Controller('stints')
export class StintsController {

    constructor(private readonly stintsService: StintsService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new stint' })
    @ApiResponse({ status: 201, description: 'Stint successfully created' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    create(@Body() createStintDto: CreateStintDto) {
        return this.stintsService.create(createStintDto);
    }

    @Post('with-initial-stop')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new stint with initial stop' })
    @ApiResponse({ status: 201, description: 'Stint with initial stop successfully created' })
    @ApiResponse({ status: 400, description: 'Bad request - invalid input' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - user doesn\'t have permission to create in this trip' })
    createWithInitialStop(
        @Body() createStintWithStopDto: CreateStintWithStopDto,
        @GetUser() user: User
    ) {
        return this.stintsService.createWithInitialStop(createStintWithStopDto, user.user_id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a stint by ID' })
    @ApiResponse({ status: 200, description: 'Stint found' })
    @ApiResponse({ status: 404, description: 'Stint not found' })
    findOne(@Param('id') id: number) {
        return this.stintsService.findOne(id);
    }

    @Put(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Update a stint' })
    @ApiResponse({ status: 200, description: 'Stint updated successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiResponse({ status: 404, description: 'Stint not found' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateStintDto: CreateStintDto,
        @GetUser() user: User
    ) {
        return this.stintsService.update(id, updateStintDto, user.user_id);
    }


    @Delete(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Delete a stint' })
    @ApiResponse({ status: 200, description: 'Stint deleted successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiResponse({ status: 404, description: 'Stint not found' })
    remove(
        @Param('id', ParseIntPipe) id: number,
        @GetUser() user: User
    ) {
        return this.stintsService.remove(id, user.user_id);
    }
}