import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { GetManyItemsSchema, IItemsQuery } from './schemas/items.schema';
import ItemsService from './services/items.service';

export function InitItemsRouter(
  app: FastifyInstance,
  itemsService: ItemsService
) {
  // ------------------------------------------------------------------------------------

  app.get('/many/2', async (request: FastifyRequest, reply: FastifyReply) => {
    const items = await itemsService.getItems2();
    return reply.send(items);
  });

  app.get(
    '/many',
    { schema: GetManyItemsSchema.schema },
    async (
      request: FastifyRequest<{ Querystring: IItemsQuery }>,
      reply: FastifyReply
    ) => {
      const { app_id, currency } = request.query;
      const items = await itemsService.getItems(app_id, currency);
      return reply.send(items);
    }
  );

  // ------------------------------------------------------------------------------------
}
