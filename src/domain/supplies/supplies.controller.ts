import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { SuppliesService } from './supplies.service';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateSupplyDto } from './dto/create-supply.dto';
import { SupplyCategory } from '../../common/enums';
import { UpdateSupplyDto } from './dto/update-supply-dto';

@ApiTags('Supplies')
@Controller('supplies')
export class SuppliesController {
  constructor(private readonly suppliesService: SuppliesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new supply' })
  @ApiResponse({
    status: 201,
    description: 'Supply has been successfully created ',
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid input' })
  @ApiBody({
    description: 'Supply creation data',
    type: CreateSupplyDto,
    examples: {
      'Camping Gear': {
        summary: 'Camping Gear',
        description: 'Create a camping gear supply item',
        value: {
          name: '4-person tent',
          category: 'gear',
        },
      },
      'Food Item': {
        summary: 'Food Item',
        description: 'Create a food supply item',
        value: {
          name: 'Trail mix (5 packs)',
          category: 'food',
        },
      },
      'Emergency Supply': {
        summary: 'Emergency Supply',
        description: 'Create an emergency supply item',
        value: {
          name: 'First aid kit',
          category: 'emergency',
        },
      },
    },
  })
  create(@Body() createSupplyDto: CreateSupplyDto) {
    return this.suppliesService.create(createSupplyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all supplies' })
  @ApiResponse({
    status: 200,
    description: 'Returns all supplies',
    content: {
      'application/json': {
        example: [
          {
            id: 1,
            name: '4-person tent',
            category: 'gear',
            created_at: '2023-10-01T12:00:00Z',
          },
          {
            id: 2,
            name: 'Sleeping bag',
            category: 'gear',
            created_at: '2023-10-02T15:30:00Z',
          },
          {
            id: 3,
            name: 'Trail mix (5 packs)',
            category: 'food',
            created_at: '2023-10-03T09:00:00Z',
          },
          {
            id: 4,
            name: 'First aid kit',
            category: 'emergency',
            created_at: '2023-10-04T11:45:00Z',
          },
        ],
      },
    },
  })
  findAll() {
    return this.suppliesService.findAllSupplies();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a supply by ID' })
  @ApiParam({ name: 'id', description: 'Supply ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the supply',
    content: {
      'application/json': {
        example: {
          id: 1,
          name: '4-person tent',
          category: 'gear',
          created_at: '2023-10-01T12:00:00Z',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Supply not found' })
  findOne(@Param('id') id: number) {
    return this.suppliesService.findOne(id);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get supplies by category' })
  @ApiParam({ name: 'category', description: 'Supply category' })
  @ApiResponse({
    status: 200,
    description: 'Returns all supplies for given category',
    content: {
      'application/json': {
        example: [
          {
            id: 1,
            name: '4-person tent',
            category: 'gear',
            created_at: '2023-10-01T12:00:00Z',
          },
          {
            id: 2,
            name: 'Sleeping bag',
            category: 'gear',
            created_at: '2023-10-02T15:30:00Z',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Supplies not found' })
  findByCategory(@Param('category') category: SupplyCategory) {
    return this.suppliesService.findByCategory(category);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a supply' })
  @ApiParam({ name: 'id', description: 'Supply ID' })
  @ApiResponse({
    status: 200,
    description: 'Supply has been successfully updated',
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid input' })
  @ApiResponse({ status: 404, description: 'Supply not found' })
  update(@Param('id') id: number, @Body() updateSupplyDto: UpdateSupplyDto) {
    return this.suppliesService.update(id, updateSupplyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a supply' })
  @ApiParam({ name: 'id', description: 'Supply ID' })
  @ApiResponse({
    status: 200,
    description: 'Supply has been successfully deleted',
  })
  @ApiResponse({ status: 404, description: 'Supply not found' })
  remove(@Param('id') id: number) {
    return this.suppliesService.remove(id);
  }
}
