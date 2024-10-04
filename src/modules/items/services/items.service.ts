import { FastifyRedis } from '@fastify/redis';
import { createReadStream } from 'fs';
import * as path from 'path';
import { createInterface } from 'readline';
import { CurrencyEnum } from '../types/currency.enum';
import { IItem } from '../types/item';
import { AppId } from '../types/types';
import { ItemsRepository } from './items.repository';

export default class ItemsService {
  private readonly CACHE_TTL = 30 * 60;

  constructor(
    private readonly redisClient: FastifyRedis,
    private readonly itemsRepository: ItemsRepository
  ) {
    // generateFakes()
    // this.itemsRepository.fetchManyItems().then(console.log)
  }


  async getItems2(): Promise<IItem[]> {
    const cacheKey = `items:many:2`;
    return this.getFromCacheOrFetch(cacheKey, () =>
      this.itemsRepository.fetchManyItems()
    );
  }

  async getItems(
    app_id: AppId = '730',
    currency: CurrencyEnum = CurrencyEnum.EUR
  ): Promise<IItem[]> {
    const cacheKey = `items:${app_id}:${currency}`;
    return this.getFromCacheOrFetch(cacheKey, () =>
      this.itemsRepository.getItems(app_id, currency)
    );
  }

  private async getFromCacheOrFetch(
    cacheKey: string,
    fetchFunction: () => Promise<IItem[]>
  ): Promise<IItem[]> {
    const cachedItems = await this.redisClient.get(cacheKey);

    if (cachedItems) {
      return JSON.parse(cachedItems);
    }

    const items = await fetchFunction();
    await this.redisClient.set(
      cacheKey,
      JSON.stringify(items),
      'EX',
      this.CACHE_TTL
    );
    return items;
  }

  async getFakes() {
    const filePath = path.join(__dirname, 'generatedItems.json');
    const fileStream = createReadStream(filePath, { encoding: 'utf-8' });

    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let jsonData = '';

    for await (const line of rl) {
      jsonData += line;
    }
    return JSON.parse(jsonData);
  }
}


