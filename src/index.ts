import 'reflect-metadata';
import { createExpressServer, useContainer } from 'routing-controllers';
import path from 'path';
import Container from 'typedi';
import { CustomErrorHandler } from './libs/middlewares/custom-error-handler';
import { generateSwaggerSpec } from './swagger';
import swaggerUi from 'swagger-ui-express';

const PORT = process.env.PORT || 3000;

useContainer(Container);

const app = createExpressServer({
  routePrefix: '/api',
  controllers: [path.join(__dirname + '/api/*/*.controller.*')],
  middlewares: [CustomErrorHandler],
  validation: true,
  classTransformer: true,
  defaultErrorHandler: false,
});

const swaggerSpec = generateSwaggerSpec();

// Serve Swagger UI
app.use(
  '/api',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: 'Shield API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
  }),
);

app.listen(PORT, () => console.log(`Process running at ${PORT}`));
