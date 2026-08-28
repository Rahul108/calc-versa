import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AgentModule } from './agent/agent.module';
import { GeminiModule } from './gemini/gemini.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';

@Module({
  imports: [GeminiModule, AgentModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
