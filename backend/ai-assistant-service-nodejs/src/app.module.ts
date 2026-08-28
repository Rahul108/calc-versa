import { Module } from '@nestjs/common';
import { AgentModule } from './agent/agent.module';
import { GeminiModule } from './gemini/gemini.module';

@Module({
  imports: [GeminiModule, AgentModule],
})
export class AppModule {}
