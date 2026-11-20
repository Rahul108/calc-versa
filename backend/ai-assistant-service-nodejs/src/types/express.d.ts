declare global {
  namespace Express {
    interface Request {
      /** Set by CorrelationIdMiddleware. */
      correlationId?: string;
      /** Set by GatewayAuthGuard after the API Gateway verified the token. */
      user?: { id: string; username: string; email: string };
    }
  }
}

export {};
