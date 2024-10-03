import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  IPostUserWithdrawalBalance,
  PostUserBalanceWithdrawalSchema
} from './schemas/post-balance-withdrawal.schema';
import { PostCreateUserSchema } from './schemas/post-create.schema';
import UserService from './user.service';

export function InitUserRouter(app: FastifyInstance, userService: UserService) {
  // ----------------------------------------------------

  app.post(
    '',
    { schema: PostCreateUserSchema.schema },
    async (req: FastifyRequest, rep: FastifyReply) => {
      const result = await userService.createUser();
      return rep.send(result);
    }
  );

  // ----------------------------------------------------

  app.post(
    '/balance/withdrawal',
    { schema: PostUserBalanceWithdrawalSchema.schema },
    async (
      req: FastifyRequest<{ Body: IPostUserWithdrawalBalance }>,
      rep: FastifyReply
    ) => {
      const { user_id, amount } = req.body;
      const result = await userService.balanceWithdraw(user_id, amount);
      return rep.send(result);
    }
  );
}
