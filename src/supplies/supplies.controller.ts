import {Body, Controller, Delete, Get, Param, Post, Put} from '@nestjs/common';
import {SuppliesService} from "./supplies.service";
import {ApiOperation, ApiParam, ApiResponse} from "@nestjs/swagger";
import {CreateSupplyDto} from "./dto/create-supply.dto";
import {SupplyCategory} from "../common/enums";
import {UpdateSupplyDto} from "./dto/update-supply-dto";

@Controller('supplies')
export class SuppliesController {

    constructor(private readonly suppliesService: SuppliesService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new supply' })
    @ApiResponse({ status: 201, description: 'Supply has been successfully created '})
    @ApiResponse({ status: 400, description: 'Bad request - invalid input' })
    create(@Body() createSupplyDto: CreateSupplyDto) {
        return this.suppliesService.create(createSupplyDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all supplies' })
    @ApiResponse({ status: 200, description: 'Returns all supplies' })
    findAll() {
        return this.suppliesService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a supply by ID' })
    @ApiParam({ name: 'id', description: 'Supply ID' })
    @ApiResponse({ status: 200, description: 'Returns the supply' })
    @ApiResponse({ status: 404, description: 'Supply not found' })
    findOne(@Param('id') id: number) {
        return this.suppliesService.findOne(id);
    }

    @Get('category/:category')
    @ApiOperation({ summary: 'Get supplies by category' })
    @ApiParam({ name: 'category', description: 'Supply category' })
    @ApiResponse({ status: 200, description: 'Returns all supplies for given category' })
    @ApiResponse({ status: 404, description: 'Supplies not found' })
    findByCategory(@Param('category') category: SupplyCategory) {
        return this.suppliesService.findByCategory(category);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a supply' })
    @ApiParam({ name: 'id', description: 'Supply ID' })
    @ApiResponse({ status: 200, description: 'Supply has been successfully updated' })
    @ApiResponse({ status: 400, description: 'Bad request - invalid input' })
    @ApiResponse({ status: 404, description: 'Supply not found' })
    update(@Param('id') id: number, @Body() updateSupplyDto: UpdateSupplyDto) {
        return this.suppliesService.update(id, updateSupplyDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a supply' })
    @ApiParam({ name: 'id', description: 'Supply ID' })
    @ApiResponse({ status: 200, description: 'Supply has been successfully deleted' })
    @ApiResponse({ status: 404, description: 'Supply not found' })
    remove(@Param('id') id: number) {
        return this.suppliesService.remove(id);
    }
}
