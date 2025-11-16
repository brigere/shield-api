import 'reflect-metadata';
import { createExpressServer, useContainer, useExpressServer } from 'routing-controllers';
import path from 'path';
import Container from 'typedi';
import { CustomErrorHandler } from './libs/middlewares/custom-error-handler';
import { generateSwaggerSpec } from './swagger';
import swaggerUi from 'swagger-ui-express';
import { PrismaService } from './config/prisma';
import express from 'express';

const PORT = process.env.PORT || 3000;

useContainer(Container);

const prisma = Container.get(PrismaService);

prisma
  .connect()
  .then(() => {
    console.log('Database connected');
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    useExpressServer(app, {
      routePrefix: '/api',
      controllers: [path.join(__dirname + '/api/*/*.controller.*')],
      middlewares: [CustomErrorHandler],
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

    app.listen(PORT, () => console.log(`Process running at ${PORT}`));
  })
  .catch((e) => {
    console.error('Somthing happenend while connecting to DB', e);
  });
