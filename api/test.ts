import { Hono } from 'hono';
import { handle } from 'hono/vercel';

const app = new Hono();

app.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'Test function works',
    timestamp: new Date().toISOString(),
  });
});

export const GET = handle(app);

