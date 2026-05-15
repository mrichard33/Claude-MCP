import { timingSafeEqual } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

export function validateAuth(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.MCP_AUTH_TOKEN;
  if (!expected) {
    // Hard fail closed: refuse to serve MCP traffic when auth is not configured.
    res.status(500).json({ error: 'Server misconfigured: MCP_AUTH_TOKEN not set' });
    return;
  }
  const header = req.headers['authorization'];
  if (!header || typeof header !== 'string' || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Bearer token required' });
    return;
  }
  const provided = header.slice(7);
  const a = Buffer.from(provided, 'utf-8');
  const b = Buffer.from(expected, 'utf-8');
  if (a.length !== b.length) {
    res.status(401).json({ error: 'Unauthorized: invalid token' });
    return;
  }
  if (!timingSafeEqual(a, b)) {
    res.status(401).json({ error: 'Unauthorized: invalid token' });
    return;
  }
  next();
}
