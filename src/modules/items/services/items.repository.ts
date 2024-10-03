import axios from 'axios';

import path from 'path';
import { Worker } from 'worker_threads';
import { CurrencyEnum } from '../types/currency.enum';
import { IItem } from '../types/item';
import { SkinportResponse } from '../types/skinport.reponse';
import { AppId } from '../types/types';

export class ItemsRepository {
  private readonly skinportApi = 'https://api.skinport.com/v1/items';

  constructor() {
    // // generateFakes()
    // this.processInWorker().then(r => {
    //   console.log({r})
    // })
  }

  fetchManyItems(): Promise<any> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(path.join(__dirname, 'test.process.js'));

      worker.on('message', resolve); 
      worker.on('error', reject); 
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }

  async getItems(app_id: AppId, currency: CurrencyEnum): Promise<IItem[]> {
    try {
      const [tradableData, nonTradableData] = await Promise.all([
        this.fetchItems(app_id, currency, 0),
        this.fetchItems(app_id, currency, 1)
      ]);

      return this.mergeItems(tradableData, nonTradableData);
    } catch (error) {
      console.error('Error fetching items:', error);
      return [];
    }
  }

  private async fetchItems(
    app_id: AppId,
    currency: CurrencyEnum,
    tradable: number
  ): Promise<SkinportResponse[]> {
    const response = await axios.get<SkinportResponse[]>(this.skinportApi, {
      params: { app_id, currency, tradable }
    });
    return response.data;
  }

  private mergeItems(
    tradableData: SkinportResponse[],
    nonTradableData: SkinportResponse[]
  ): IItem[] {
    return tradableData.map((tradableItem, index) => {
      const nonTradableItem = nonTradableData[index];
      return {
        name: tradableItem.market_hash_name,
        min_prices: {
          tradable_price: tradableItem.min_price,
          non_tradable_price: nonTradableItem.min_price
        }
      };
    });
  }
}
