import { IPostUserBalanceWithdrawalResponse } from './schemas/post-balance-withdrawal.schema';
import { IPostCreateUser } from './schemas/post-create.schema';
import UserRepository from './user.repository';

class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(): Promise<IPostCreateUser> {
    return  this.userRepository.createUser();
  }

  async balanceWithdraw(
    userId: number,
    amount: number
  ): Promise<IPostUserBalanceWithdrawalResponse> {
    const client = await this.userRepository.db.connect();

    try {
      await client.query('BEGIN');

      const currentBalance = await this.userRepository.getUserBalanceForUpdate(
        client,
        userId
      );

      if (currentBalance < amount) {
        throw {
          statusCode: 400,
          message: `Insufficient balance for user with id ${userId}.`
        };
      }

      const newBalance = currentBalance - amount;

      await this.userRepository.updateUserBalance(client, userId, newBalance);

      await client.query('COMMIT');

      return {
        message: `Successfully withdrawal $${amount} from user with id ${userId}. Old balance: $${currentBalance}. New balance: $${newBalance.toFixed(
          2
        )}.`
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default UserService;
