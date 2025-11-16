import 'reflect-metadata';
import { createExpressServer, useContainer } from 'routing-controllers';
import path from 'path';
import Container from 'typedi';
import { CustomErrorHandler } from './libs/middlewares/validation-error';

useContainer(Container);

const app = createExpressServer({
  routePrefix: '/api',
  controllers: [path.join(__dirname + '/api/*/*.controller.*')],
  middlewares: [CustomErrorHandler],
  validation: true,
  classTransformer: true,
  defaultErrorHandler: false,
});

app.listen(3000);
