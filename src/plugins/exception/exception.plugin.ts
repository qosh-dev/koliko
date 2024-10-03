import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

const exceptionPlugin = async (app: FastifyInstance) => {
  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);

    if (error.statusCode) {
      reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        message: error.message
      });
    } else if (error.validation) {
      reply.status(400).send({
        statusCode: 400,
        message: error.message || 'Invalid request parameters.'
      });
    } else {
      reply.status(500).send({
        statusCode: 500,
        message: 'An unexpected error occurred. Please try again later.'
      });
    }
  });
};

export default fp(exceptionPlugin);
