// Imported via ../config/env so Jest's moduleNameMapper can substitute the test stub.
import { env } from '../config/env';

const trimSlash = (url: string) => url.replace(/\/+$/, '');

/** API Gateway base URL. Set VITE_API_GATEWAY_URL at build time; defaults to local Docker. */
export const API_GATEWAY_URL = trimSlash(env.apiGatewayUrl || 'http://localhost:3005');

/** AI Assistant base URL. Set VITE_AI_ASSISTANT_URL at build time; defaults to local Docker. */
export const AI_ASSISTANT_URL = trimSlash(env.aiAssistantUrl || 'http://localhost:3006');
