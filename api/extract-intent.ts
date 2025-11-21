import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { extractIntent } from '../services/intent-extraction';
import { getContainer } from '../lib/cosmos';
import type { ChatMessage } from '@plateful/shared';

const app = new Hono();

interface ExtractIntentRequest {
  conversationID: string;
  userID: string;
}

app.post('/', async (c) => {
  try {
    const body = await c.req.json<ExtractIntentRequest>();
    const { conversationID, userID } = body;

    if (!conversationID || !userID) {
      return c.json({ error: 'conversationID and userID are required' }, 400);
    }

    console.log(`🧠 Extracting intent for conversation ${conversationID}`);

    // Fetch conversation messages
    const messagesContainer = getContainer('chatMessages');
    if (!messagesContainer) {
      return c.json({ error: 'Database not available' }, 503);
    }

    const { resources: messages } = await messagesContainer.items
      .query<ChatMessage>({
        query: 'SELECT * FROM c WHERE c.conversationID = @conversationID ORDER BY c.messageIndex ASC',
        parameters: [{ name: '@conversationID', value: conversationID }],
      })
      .fetchAll();

    if (messages.length === 0) {
      return c.json({ error: 'No messages found in conversation' }, 404);
    }

    // Extract intent
    const intent = await extractIntent(messages);
    console.log(`✅ Intent extracted: ${intent.dish} (status: ${intent.status})`);

    return c.json(intent);
  } catch (error) {
    console.error('❌ Failed to extract intent:', error);
    return c.json({ error: 'Failed to extract intent from conversation' }, 500);
  }
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
