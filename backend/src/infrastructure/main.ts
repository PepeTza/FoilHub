import './config/load-env.js';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { configureApp } from './configure-app.js';
import { AppModule } from './modules/app.module.js';

const port = Number(process.env.PORT ?? 3000);
const app = configureApp(await NestFactory.create(AppModule));
await app.listen(port);
new Logger('Bootstrap').log(`API escuchando en el puerto ${port}`);
