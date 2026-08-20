import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import type { Server } from 'node:http';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import type { Application } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { SafeJsonLogger } from './common/safe-json-logger';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });
  const config = app.get(ConfigService);
  app.useLogger(new SafeJsonLogger(config.getOrThrow<string>('app.logLevel')));
  app.enableShutdownHooks();
  const express = app.getHttpAdapter().getInstance() as Application;
  express.set('trust proxy', config.getOrThrow<boolean>('app.trustProxy'));
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: config.getOrThrow<string>('app.webOrigin'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['content-type', 'x-csrf-token', 'x-correlation-id'],
  });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  if (config.get<string>('app.environment') !== 'production') {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Residence.io API')
        .setVersion('1')
        .addCookieAuth(config.getOrThrow<string>('session.cookieName'))
        .build(),
    );
    SwaggerModule.setup('api/docs', app, document);
  }
  await app.listen(config.getOrThrow<number>('app.port'), '0.0.0.0');
  const server = app.getHttpServer() as unknown as Server;
  const requestTimeout = config.getOrThrow<number>('app.requestTimeoutMs');
  server.requestTimeout = requestTimeout;
  server.headersTimeout = Math.min(requestTimeout + 5_000, 125_000);
  server.keepAliveTimeout = 5_000;
}

void bootstrap();
