import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
// import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { validateEnv } from './config/env.validation.js';

async function bootstrap() {
  const env = validateEnv();
  const app = await NestFactory.create(AppModule);

  // Add common HTTP security headers.
  // app.use(helmet());

  // Allow requests from the configured frontend origin(s).
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((origin) => origin.trim())
    : ['http://localhost:5173'];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: false,
  });

  // Close database connections and other resources on shutdown.
  app.enableShutdownHooks();

  await app.listen(env.PORT);

  console.log(`Application running on http://localhost:${env.PORT}`);
}

await bootstrap();
