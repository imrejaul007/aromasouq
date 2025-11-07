import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductDto } from './dto/search-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.productsService.findAll(page, limit);
  }

  @Get('search')
  search(@Query() searchDto: SearchProductDto) {
    return this.productsService.search(searchDto);
  }

  @Get('featured')
  getFeatured(@Query('limit') limit?: number) {
    return this.productsService.getFeatured(limit);
  }

  @Get('new-arrivals')
  getNewArrivals(@Query('limit') limit?: number) {
    return this.productsService.getNewArrivals(limit);
  }

  @Get('best-sellers')
  getBestSellers(@Query('limit') limit?: number) {
    return this.productsService.getBestSellers(limit);
  }

  @Get('brand/:brandSlug')
  getByBrand(
    @Param('brandSlug') brandSlug: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.getByBrand(brandSlug, page, limit);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Get('sku/:sku')
  findBySku(@Param('sku') sku: string) {
    return this.productsService.findBySku(sku);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get(':id/similar')
  getSimilar(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.productsService.getSimilarProducts(id, limit);
  }

  @Get(':id/similar-enhanced')
  getSimilarEnhanced(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.productsService.getSimilarProductsEnhanced(id, limit);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Patch(':id/stock')
  updateStock(
    @Param('id') id: string,
    @Body() body: { vendorId: string; quantity: number },
  ) {
    return this.productsService.updateStock(id, body.vendorId, body.quantity);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Delete(':id/hard')
  hardDelete(@Param('id') id: string) {
    return this.productsService.hardDelete(id);
  }

  @Post('bulk/prices')
  bulkUpdatePrices(@Body() updates: Array<{ id: string; price: number }>) {
    return this.productsService.bulkUpdatePrices(updates);
  }

  // NEW: Mood-based endpoints
  @Get('mood/:mood')
  getByMood(@Param('mood') mood: string, @Query('limit') limit?: number) {
    return this.productsService.getByMood(mood, limit);
  }

  @Get('moods/multiple')
  getByMultipleMoods(@Query('moods') moods: string, @Query('limit') limit?: number) {
    const moodArray = moods.split(',');
    return this.productsService.getByMultipleMoods(moodArray, limit);
  }

  // NEW: Cashback endpoints
  @Get('cashback/high')
  getHighCashback(@Query('minRate') minRate?: number, @Query('limit') limit?: number) {
    return this.productsService.getHighCashback(minRate, limit);
  }

  // NEW: Projection endpoints
  @Get('projection/strong')
  getStrongProjection(@Query('minRating') minRating?: number, @Query('limit') limit?: number) {
    return this.productsService.getStrongProjection(minRating, limit);
  }

  // NEW: Fulfillment type endpoints
  @Get('fulfillment/:type')
  getByFulfillmentType(
    @Param('type') type: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.getByFulfillmentType(type, page, limit);
  }

  @Get('wholesale/products')
  getWholesaleProducts(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.productsService.getWholesaleProducts(page, limit);
  }

  @Get('manufacturing/products')
  getManufacturingProducts(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.productsService.getManufacturingProducts(page, limit);
  }

  @Get('raw-materials/products')
  getRawMaterials(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.productsService.getRawMaterials(page, limit);
  }

  // ELASTICSEARCH ENDPOINTS

  @Get('elastic/search')
  elasticSearch(@Query() searchDto: SearchProductDto) {
    return this.productsService.elasticSearch(searchDto);
  }

  @Get('elastic/aggregations')
  getAggregations(@Query() filters: any) {
    return this.productsService.getAggregations(filters);
  }

  @Get('elastic/autocomplete')
  autocomplete(@Query('field') field: string, @Query('text') text: string, @Query('size') size?: number) {
    return this.productsService.autocomplete(field, text, size);
  }

  @Post('elastic/bulk-index')
  @HttpCode(HttpStatus.OK)
  bulkIndexToElasticsearch() {
    return this.productsService.bulkIndexToElasticsearch();
  }

  // ==================== WEEK 2-3: ADDITIONAL SMART FILTERS ====================

  @Get('scent-family/:scentFamily')
  getByScentFamily(
    @Param('scentFamily') scentFamily: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.getByScentFamily(scentFamily, page, limit);
  }

  @Get('occasion/:occasion')
  getByOccasion(
    @Param('occasion') occasion: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.getByOccasion(occasion, page, limit);
  }

  @Get('concentration/:concentration')
  getByConcentration(
    @Param('concentration') concentration: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.getByConcentration(concentration, page, limit);
  }

  @Get('oud-type/:oudType')
  getByOudType(
    @Param('oudType') oudType: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.getByOudType(oudType, page, limit);
  }

  @Get('season/:season')
  getBySeason(@Param('season') season: string, @Query('limit') limit?: number) {
    return this.productsService.getBySeason(season, limit);
  }

  @Get('time-of-day/:timeOfDay')
  getByTimeOfDay(@Param('timeOfDay') timeOfDay: string, @Query('limit') limit?: number) {
    return this.productsService.getByTimeOfDay(timeOfDay, limit);
  }

  @Get('longevity/range')
  getByLongevity(
    @Query('minHours') minHours: number,
    @Query('maxHours') maxHours?: number,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.getByLongevity(minHours, maxHours, limit);
  }

  @Get('clones/:brandName')
  findClones(@Param('brandName') brandName: string, @Query('limit') limit?: number) {
    return this.productsService.findClones(brandName, limit);
  }

  @Get('scent-dna/match')
  findByScentDNA(
    @Query('topNotes') topNotes?: string,
    @Query('middleNotes') middleNotes?: string,
    @Query('baseNotes') baseNotes?: string,
    @Query('limit') limit?: number,
  ) {
    const topNotesArray = topNotes ? topNotes.split(',') : undefined;
    const middleNotesArray = middleNotes ? middleNotes.split(',') : undefined;
    const baseNotesArray = baseNotes ? baseNotes.split(',') : undefined;

    return this.productsService.findByScentDNA(
      topNotesArray,
      middleNotesArray,
      baseNotesArray,
      limit,
    );
  }

  @Get('type/original')
  getOriginalPerfumes(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.productsService.getOriginalPerfumes(page, limit);
  }

  @Get('type/clone')
  getClonePerfumes(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.productsService.getClonePerfumes(page, limit);
  }

  @Get('type/niche')
  getNichePerfumes(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.productsService.getNichePerfumes(page, limit);
  }

  @Get('type/attar')
  getAttarProducts(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.productsService.getAttarProducts(page, limit);
  }

  @Get('type/oud')
  getOudProducts(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.productsService.getOudProducts(page, limit);
  }
}
