import { FastifyRedis } from '@fastify/redis';
import { CurrencyEnum } from '../types/currency.enum';
import { IItem } from '../types/item';
import { AppId } from '../types/types';
import { ItemsRepository } from './items.repository';

export default class ItemsService {
  private readonly CACHE_TTL = 30 * 60;

  constructor(
    private readonly redisClient: FastifyRedis,
    private readonly itemsRepository: ItemsRepository
  ) {}

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
      console.log(`Using cached data for key: ${cacheKey}`);
      return JSON.parse(cachedItems);
    }

    const items = await fetchFunction();
    await this.redisClient.set(
      cacheKey,
      JSON.stringify(items),
      'EX',
      this.CACHE_TTL
    );
    console.log(`Fetched and cached data for key: ${cacheKey}`);
    return items;
  }
}
