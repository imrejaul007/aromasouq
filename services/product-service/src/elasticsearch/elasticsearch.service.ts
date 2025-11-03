import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService as NestElasticsearchService } from '@nestjs/elasticsearch';
import { Product } from '../schemas/product.schema';

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private readonly logger = new Logger(ElasticsearchService.name);
  private readonly index = 'products';

  constructor(private readonly esService: NestElasticsearchService) {}

  async onModuleInit() {
    await this.createIndex();
  }

  async createIndex() {
    try {
      const indexExists = await this.esService.indices.exists({
        index: this.index,
      });

      if (!indexExists) {
        await this.esService.indices.create({
          index: this.index,
          settings: {
              analysis: {
                analyzer: {
                  arabic_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'arabic_normalization', 'arabic_stemmer'],
                  },
                  english_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'english_stemmer'],
                  },
                },
                filter: {
                  arabic_stemmer: {
                    type: 'stemmer',
                    language: 'arabic',
                  },
                  english_stemmer: {
                    type: 'stemmer',
                    language: 'english',
                  },
                },
              },
            },
          mappings: {
            properties: {
                sku: { type: 'keyword' },
                name: {
                  type: 'text',
                  analyzer: 'english_analyzer',
                  fields: {
                    keyword: { type: 'keyword' },
                    suggest: {
                      type: 'completion',
                    },
                  },
                },
                slug: { type: 'keyword' },
                description: {
                  type: 'text',
                  analyzer: 'english_analyzer',
                },
                shortDescription: {
                  type: 'text',
                  analyzer: 'english_analyzer',
                },
                brand: {
                  properties: {
                    id: { type: 'keyword' },
                    name: {
                      type: 'text',
                      fields: {
                        keyword: { type: 'keyword' },
                      },
                    },
                    slug: { type: 'keyword' },
                  },
                },
                taxonomy: {
                  properties: {
                    type: { type: 'keyword' },
                    scentFamily: { type: 'keyword' },
                    gender: { type: 'keyword' },
                    region: { type: 'keyword' },
                    priceSegment: { type: 'keyword' },
                    occasion: { type: 'keyword' },
                    mood: { type: 'keyword' },
                    oudType: { type: 'keyword' },
                    concentration: { type: 'keyword' },
                    collection: { type: 'keyword' },
                    fulfillmentType: { type: 'keyword' },
                  },
                },
                attributes: {
                  properties: {
                    volume: { type: 'keyword' },
                    longevityHours: { type: 'integer' },
                    projection: { type: 'keyword' },
                    projectionRating: { type: 'integer' },
                    seasons: { type: 'keyword' },
                    timesOfDay: { type: 'keyword' },
                  },
                },
                scent: {
                  properties: {
                    topNotes: {
                      type: 'text',
                      fields: {
                        keyword: { type: 'keyword' },
                      },
                    },
                    middleNotes: {
                      type: 'text',
                      fields: {
                        keyword: { type: 'keyword' },
                      },
                    },
                    baseNotes: {
                      type: 'text',
                      fields: {
                        keyword: { type: 'keyword' },
                      },
                    },
                    dnaSimilarTo: { type: 'keyword' },
                    similarityScore: { type: 'float' },
                  },
                },
                pricing: {
                  properties: {
                    retail: {
                      properties: {
                        amount: { type: 'float' },
                        currency: { type: 'keyword' },
                      },
                    },
                    wholesale: {
                      properties: {
                        amount: { type: 'float' },
                        currency: { type: 'keyword' },
                        minQuantity: { type: 'integer' },
                      },
                    },
                    manufacture: {
                      properties: {
                        amount: { type: 'float' },
                        currency: { type: 'keyword' },
                        minQuantity: { type: 'integer' },
                      },
                    },
                    salePrice: {
                      properties: {
                        amount: { type: 'float' },
                        currency: { type: 'keyword' },
                        validUntil: { type: 'date' },
                      },
                    },
                    cashbackRate: { type: 'float' },
                  },
                },
                stats: {
                  properties: {
                    viewsTotal: { type: 'long' },
                    views30d: { type: 'long' },
                    salesTotal: { type: 'long' },
                    sales30d: { type: 'long' },
                    ratingAvg: { type: 'float' },
                    ratingCount: { type: 'long' },
                    conversionRate: { type: 'float' },
                  },
                },
                flags: {
                  properties: {
                    active: { type: 'boolean' },
                    featured: { type: 'boolean' },
                    newArrival: { type: 'boolean' },
                    bestSeller: { type: 'boolean' },
                    lowStock: { type: 'boolean' },
                    outOfStock: { type: 'boolean' },
                  },
                },
                geo: {
                  properties: {
                    availableCountries: { type: 'keyword' },
                    featuredCities: { type: 'keyword' },
                    sameDayDeliveryCities: { type: 'keyword' },
                  },
                },
                createdAt: { type: 'date' },
                updatedAt: { type: 'date' },
              },
            },
        });

        this.logger.log(`Elasticsearch index '${this.index}' created successfully`);
      } else {
        this.logger.log(`Elasticsearch index '${this.index}' already exists`);
      }
    } catch (error) {
      this.logger.error(`Failed to create Elasticsearch index: ${error.message}`);
    }
  }

  async indexProduct(product: Product & { _id: any }) {
    try {
      await this.esService.index({
        index: this.index,
        id: product._id.toString(),
        document: {
          sku: product.sku,
          name: product.name,
          slug: product.slug,
          description: product.description,
          shortDescription: product.shortDescription,
          brand: product.brand,
          taxonomy: product.taxonomy,
          attributes: product.attributes,
          scent: product.scent,
          pricing: product.pricing,
          stats: product.stats,
          flags: product.flags,
          geo: product.geo,
          createdAt: (product as any).createdAt,
          updatedAt: (product as any).updatedAt,
        },
      });

      this.logger.debug(`Product ${product.sku} indexed successfully`);
    } catch (error) {
      this.logger.error(`Failed to index product ${product.sku}: ${error.message}`);
    }
  }

  async updateProduct(productId: string, product: Partial<Product>) {
    try {
      await this.esService.update({
        index: this.index,
        id: productId,
        doc: product,
      });

      this.logger.debug(`Product ${productId} updated in Elasticsearch`);
    } catch (error) {
      this.logger.error(`Failed to update product ${productId}: ${error.message}`);
    }
  }

  async deleteProduct(productId: string) {
    try {
      await this.esService.delete({
        index: this.index,
        id: productId,
      });

      this.logger.debug(`Product ${productId} deleted from Elasticsearch`);
    } catch (error) {
      this.logger.error(`Failed to delete product ${productId}: ${error.message}`);
    }
  }

  async search(query: any) {
    try {
      const result = await this.esService.search({
        index: this.index,
        body: query,
      });

      return result;
    } catch (error) {
      this.logger.error(`Elasticsearch search failed: ${error.message}`);
      throw error;
    }
  }

  async bulkIndex(products: (Product & { _id: any })[]) {
    try {
      const body = products.flatMap((product) => [
        { index: { _index: this.index, _id: product._id.toString() } },
        {
          sku: product.sku,
          name: product.name,
          slug: product.slug,
          description: product.description,
          shortDescription: product.shortDescription,
          brand: product.brand,
          taxonomy: product.taxonomy,
          attributes: product.attributes,
          scent: product.scent,
          pricing: product.pricing,
          stats: product.stats,
          flags: product.flags,
          geo: product.geo,
          createdAt: (product as any).createdAt,
          updatedAt: (product as any).updatedAt,
        },
      ]);

      const result = await this.esService.bulk({ operations: body });

      if (result.errors) {
        this.logger.error('Bulk indexing had errors');
      } else {
        this.logger.log(`Bulk indexed ${products.length} products`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Bulk indexing failed: ${error.message}`);
      throw error;
    }
  }

  async suggest(field: string, text: string, size = 10): Promise<any[]> {
    try {
      const result: any = await this.esService.search({
        index: this.index,
        suggest: {
          suggestions: {
            prefix: text,
            completion: {
              field: `${field}.suggest`,
              size,
              skip_duplicates: true,
            },
          },
        },
      });

      return result.suggest?.suggestions?.[0]?.options || [];
    } catch (error) {
      this.logger.error(`Autocomplete failed: ${error.message}`);
      return [];
    }
  }

  async getAggregations(filters: any = {}) {
    try {
      const must: any[] = [{ term: { 'flags.active': true } }];

      // Apply existing filters
      if (filters.type) must.push({ terms: { 'taxonomy.type': filters.type } });
      if (filters.brand) must.push({ term: { 'brand.slug': filters.brand } });
      if (filters.gender) must.push({ terms: { 'taxonomy.gender': filters.gender } });

      const result: any = await this.esService.search({
        index: this.index,
        size: 0,
        query: {
          bool: { must },
        },
        aggs: {
            brands: {
              terms: { field: 'brand.name.keyword', size: 50 },
            },
            types: {
              terms: { field: 'taxonomy.type', size: 20 },
            },
            scentFamilies: {
              terms: { field: 'taxonomy.scentFamily', size: 20 },
            },
            genders: {
              terms: { field: 'taxonomy.gender', size: 10 },
            },
            moods: {
              terms: { field: 'taxonomy.mood', size: 20 },
            },
            occasions: {
              terms: { field: 'taxonomy.occasion', size: 20 },
            },
            concentrations: {
              terms: { field: 'taxonomy.concentration', size: 10 },
            },
            fulfillmentTypes: {
              terms: { field: 'taxonomy.fulfillmentType', size: 10 },
            },
            priceSegments: {
              terms: { field: 'taxonomy.priceSegment', size: 10 },
            },
            priceStats: {
              stats: { field: 'pricing.retail.amount' },
            },
            projectionRatings: {
              histogram: {
                field: 'attributes.projectionRating',
                interval: 2,
              },
            },
            cashbackRates: {
              range: {
                field: 'pricing.cashbackRate',
                ranges: [
                  { key: '0-2%', to: 2 },
                  { key: '2-5%', from: 2, to: 5 },
                  { key: '5-10%', from: 5, to: 10 },
                  { key: '10%+', from: 10 },
                ],
              },
            },
        },
      });

      return result.aggregations;
    } catch (error) {
      this.logger.error(`Aggregations failed: ${error.message}`);
      throw error;
    }
  }
}
