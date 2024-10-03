import { RouteShorthandOptions } from 'fastify';

export interface IPostUserWithdrawalBalance {
  user_id: number;
  amount: number;
}

export interface IPostUserBalanceWithdrawalResponse {
  message: string;
}

// --------------------------------------------------------------------

const body = {
  type: 'object',
  properties: {
    user_id: { type: 'number' },
    amount: { type: 'number' }
  },
  required: ['user_id', 'amount']
};

const response = {
  200: {
    type: 'object',
    properties: {
      id: { type: 'number' },
      balance: { type: 'number' },
      message: { type: 'string' }
    }
  },
  400: {
    type: 'object',
    properties: {
      statusCode: { type: 'number' },
      message: { type: 'string' }
    }
  },
  404: {
    type: 'object',
    properties: {
      statusCode: { type: 'number' },
      message: { type: 'string' }
    }
  }
};

// --------------------------------------------------------------------

export const PostUserBalanceWithdrawalSchema: RouteShorthandOptions = {
  schema: {
    body,
    response
  }
};

// --------------------------------------------------------------------
