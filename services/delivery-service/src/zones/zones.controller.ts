import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ZonesService } from './zones.service';
import { ZoneType } from '@prisma/client';

@Controller('zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Post()
  create(@Body() createZoneDto: any) {
    return this.zonesService.create(createZoneDto);
  }

  @Get()
  findAll(
    @Query('country') country?: string,
    @Query('city') city?: string,
    @Query('type') type?: ZoneType,
    @Query('isActive') isActive?: string,
  ) {
    return this.zonesService.findAll({
      country,
      city,
      type,
      isActive: isActive ? isActive === 'true' : undefined,
    });
  }

  @Get('code/:code')
  findByCode(@Param('code') code: string) {
    return this.zonesService.findByCode(code);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.zonesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateZoneDto: any) {
    return this.zonesService.update(id, updateZoneDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.zonesService.delete(id);
  }

  @Post('calculate-rate')
  calculateRate(@Body() rateDto: any) {
    return this.zonesService.calculateRate(rateDto);
  }

  @Post('check-availability')
  checkServiceAvailability(@Body() availabilityDto: any) {
    return this.zonesService.checkServiceAvailability(availabilityDto);
  }
}
