import 'reflect-metadata';
import { useContainer, useExpressServer } from 'routing-controllers';
import path from 'path';
import Container from 'typedi';
import { CustomErrorHandler } from './libs/middlewares/custom-error-handler.middleware';
import { generateSwaggerSpec } from './config/swagger';
import swaggerUi from 'swagger-ui-express';
import { PrismaService } from './config/prisma';
import express from 'express';
import { LoggerService } from './libs/services/logger.service';

const PORT = process.env.PORT || 3000;

useContainer(Container);

const prisma = Container.get(PrismaService);
const logger = Container.get(LoggerService);

prisma
  .connect()
  .then(() => {
    logger.info('Databse connected');
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    useExpressServer(app, {
      routePrefix: '/api',
      controllers: [path.join(__dirname + '/api/*/*.controller.*')],
      middlewares: [path.join(__dirname + '/libs/middlewares/*.middleware.ts')],
      validation: true,
      classTransformer: true,
      defaultErrorHandler: false,
    });

    // Serve Swagger UI
    const swaggerSpec = generateSwaggerSpec();
    app.use(
      '/api/swagger-ui',
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customSiteTitle: 'Shield API Docs',
        customCss: '.swagger-ui .topbar { display: none }',
      }),
    );

    app.listen(PORT, () => logger.info(`Process running at ${PORT}`));
  })
  .catch((e) => {
    logger.fatal('Somthing happenend while connecting to DB', e);
  });
