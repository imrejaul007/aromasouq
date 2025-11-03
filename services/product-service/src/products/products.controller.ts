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
}
