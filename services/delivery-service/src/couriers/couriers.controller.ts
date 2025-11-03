import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CouriersService } from './couriers.service';

@Controller('couriers')
export class CouriersController {
  constructor(private readonly couriersService: CouriersService) {}

  @Get()
  findAll() {
    return this.couriersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.couriersService.findOne(id);
  }

  @Post('rates')
  getRate(@Body() getRateDto: any) {
    return this.couriersService.getRate(getRateDto);
  }
}
