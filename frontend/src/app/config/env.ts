// Build-time configuration (Vite inlines import.meta.env at build time).
// Jest maps this module to ./env.test-stub.ts because Jest cannot parse import.meta.
export const env = {
  apiGatewayUrl: import.meta.env.VITE_API_GATEWAY_URL,
  aiAssistantUrl: import.meta.env.VITE_AI_ASSISTANT_URL,
};
