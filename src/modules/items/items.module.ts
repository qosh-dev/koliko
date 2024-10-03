import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyRegisterOptions
} from 'fastify';
import { Module } from '../../lib/module';
import { InitItemsRouter } from './items.router';
import { ItemsRepository } from './services/items.repository';
import ItemsService from './services/items.service';

export class ItemsModule extends Module {
  opts: FastifyRegisterOptions<FastifyPluginOptions> = {
    prefix: '/items'
  };

  async use(app: FastifyInstance) {
    const itemsRepository = new ItemsRepository();
    const itemsService = new ItemsService(app.redis, itemsRepository);

    InitItemsRouter(app, itemsService);
  }
}
