import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto, UpdateCampaignDto, QueryCampaignsDto } from './dto';
import { CampaignType } from '@prisma/client';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  // ==================== CAMPAIGN CRUD ====================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCampaign(@Body() createCampaignDto: CreateCampaignDto) {
    return this.campaignsService.createCampaign(createCampaignDto);
  }

  @Get()
  async getCampaigns(@Query() query: QueryCampaignsDto) {
    return this.campaignsService.getCampaigns(query);
  }

  @Get('active')
  async getActiveCampaigns(@Query('type') type?: CampaignType) {
    return this.campaignsService.getActiveCampaigns(type);
  }

  @Get(':id')
  async getCampaignById(@Param('id') id: string) {
    return this.campaignsService.getCampaignById(id);
  }

  @Put(':id')
  async updateCampaign(
    @Param('id') id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
  ) {
    return this.campaignsService.updateCampaign(id, updateCampaignDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteCampaign(@Param('id') id: string) {
    return this.campaignsService.deleteCampaign(id);
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivateCampaign(@Param('id') id: string) {
    return this.campaignsService.deactivateCampaign(id);
  }

  // ==================== ELIGIBILITY & APPLICATION ====================

  @Post('check-eligibility')
  @HttpCode(HttpStatus.OK)
  async checkEligibility(
    @Body() body: { userId: string; campaignId: string; orderData?: any },
  ) {
    const { userId, campaignId, orderData } = body;
    return this.campaignsService.checkEligibility(userId, campaignId, orderData);
  }

  @Post('eligible/:userId')
  @HttpCode(HttpStatus.OK)
  async getEligibleCampaigns(@Param('userId') userId: string, @Body() orderData?: any) {
    return this.campaignsService.getEligibleCampaigns(userId, orderData);
  }

  @Post('apply')
  @HttpCode(HttpStatus.OK)
  async applyCampaign(
    @Body() body: { userId: string; campaignId: string; orderData?: any },
  ) {
    const { userId, campaignId, orderData } = body;
    return this.campaignsService.applyCampaign(userId, campaignId, orderData);
  }

  // ==================== STATS ====================

  @Get(':id/stats')
  async getCampaignStats(@Param('id') id: string) {
    return this.campaignsService.getCampaignStats(id);
  }
}
