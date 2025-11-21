import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { v4 as uuidv4 } from 'uuid';
import Anthropic from '@anthropic-ai/sdk';
import type { ChatMessage, ChatConversation } from '@plateful/shared';

const app = new Hono();

// Mock storage (in-memory) - data will be cleared on server restart
const mockConversations: Map<string, ChatConversation> = new Map();
const mockMessages: Map<string, ChatMessage[]> = new Map();

console.log('🎭 Mock Chat API initialized');

/**
 * POST /conversation - Create a new conversation
 */
app.post('/conversation', async (c) => {
  try {
    const body = await c.req.json();
    const { userID } = body;

    if (!userID) {
      return c.json({ error: 'userID is required' }, 400);
    }

    const conversationID = `conv-${uuidv4()}`;
    const now = new Date().toISOString();

    const conversation: ChatConversation = {
      id: conversationID,
      conversationID,
      userID,
      status: 'exploring',
      createdAt: now,
      updatedAt: now,
    };

    mockConversations.set(conversationID, conversation);
    mockMessages.set(conversationID, []);

    console.log(`🎭 [MOCK] Created conversation: ${conversationID}`);
    return c.json({ conversation }, 201);
  } catch (error) {
    console.error('🎭 Error creating mock conversation:', error);
    return c.json({ error: 'Failed to create conversation' }, 500);
  }
});

/**
 * GET /conversation/:id - Get conversation by ID
 */
app.get('/conversation/:id', async (c) => {
  try {
    const conversationID = c.req.param('id');
    const conversation = mockConversations.get(conversationID);

    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    return c.json({ conversation });
  } catch (error) {
    console.error('🎭 Error fetching mock conversation:', error);
    return c.json({ error: 'Failed to fetch conversation' }, 500);
  }
});

/**
 * PATCH /conversation/:id - Update conversation
 */
app.patch('/conversation/:id', async (c) => {
  try {
    const conversationID = c.req.param('id');
    const updates = await c.req.json();

    const conversation = mockConversations.get(conversationID);
    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    const updated: ChatConversation = {
      ...conversation,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    mockConversations.set(conversationID, updated);
    return c.json({ conversation: updated });
  } catch (error) {
    console.error('🎭 Error updating mock conversation:', error);
    return c.json({ error: 'Failed to update conversation' }, 500);
  }
});

/**
 * POST /message - Add a message to a conversation
 */
app.post('/message', async (c) => {
  try {
    const body = await c.req.json();
    const { conversationID, role, content } = body;

    if (!conversationID || !role || !content) {
      return c.json(
        { error: 'conversationID, role, and content are required' },
        400
      );
    }

    const messages = mockMessages.get(conversationID) || [];
    const messageIndex = messages.length;
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const message: ChatMessage = {
      id: messageId,
      conversationID,
      messageIndex,
      role,
      content,
      timestamp: new Date().toISOString(),
    };

    messages.push(message);
    mockMessages.set(conversationID, messages);

    // Update conversation's updatedAt timestamp
    const conversation = mockConversations.get(conversationID);
    if (conversation) {
      conversation.updatedAt = new Date().toISOString();
      mockConversations.set(conversationID, conversation);
    }

    console.log(`🎭 [MOCK] Added message ${messageIndex} to conversation ${conversationID}`);
    return c.json({ message }, 201);
  } catch (error) {
    console.error('🎭 Error creating mock message:', error);
    return c.json({ error: 'Failed to create message' }, 500);
  }
});

/**
 * GET /messages/:conversationID - Get all messages for a conversation
 */
app.get('/messages/:conversationID', async (c) => {
  try {
    const conversationID = c.req.param('conversationID');
    const messages = mockMessages.get(conversationID) || [];

    console.log(`🎭 [MOCK] Retrieved ${messages.length} messages for ${conversationID}`);
    return c.json({ messages });
  } catch (error) {
    console.error('🎭 Error fetching mock messages:', error);
    return c.json({ error: 'Failed to fetch messages' }, 500);
  }
});

/**
 * GET /conversations/user/:userID - Get all conversations for a user
 */
app.get('/conversations/user/:userID', async (c) => {
  try {
    const userID = c.req.param('userID');
    const conversations = Array.from(mockConversations.values()).filter(
      (conv) => conv.userID === userID
    );

    console.log(`🎭 [MOCK] Retrieved ${conversations.length} conversations for user ${userID}`);
    return c.json({ conversations });
  } catch (error) {
    console.error('🎭 Error fetching mock conversations:', error);
    return c.json({ error: 'Failed to fetch conversations' }, 500);
  }
});

/**
 * POST /ai-response - Generate AI response for a conversation (Mock version)
 */
app.post('/ai-response', async (c) => {
  try {
    const body = await c.req.json();
    const { conversationID } = body;

    if (!conversationID) {
      return c.json({ error: 'conversationID is required' }, 400);
    }

    // Get conversation messages from mock storage
    const messages = mockMessages.get(conversationID) || [];

    if (messages.length === 0) {
      return c.json({ error: 'No messages found in conversation' }, 404);
    }

    // Initialize Anthropic client
    const client = new Anthropic({ 
      apiKey: process.env.ANTHROPIC_API_KEY 
    });

    // Build conversation history for Claude
    const conversationHistory = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));

    // Generate AI response using Claude
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: "You are a helpful recipe assistant for the Plateful app. Help users discover delicious recipes through friendly conversation. Ask follow-up questions to understand their preferences, suggest dishes, and guide them toward finding the perfect recipe. Keep responses conversational, helpful, and food-focused.",
      messages: conversationHistory
    });

    // Extract the AI response
    let aiResponse = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        aiResponse += block.text;
      }
    }

    console.log(`🎭 [MOCK] Generated AI response for conversation ${conversationID}`);
    return c.json({ response: aiResponse });

  } catch (error) {
    console.error('🎭 Error generating mock AI response:', error);
    return c.json({ error: 'Failed to generate AI response' }, 500);
  }
});

/**
 * POST /load-recipe - Load a recipe into chat for editing (Mock version)
 */
app.post('/load-recipe', async (c) => {
  try {
    const body = await c.req.json();
    const { conversationID, recipeID, userID } = body;

    if (!conversationID || !recipeID || !userID) {
      return c.json({ error: 'conversationID, recipeID, and userID are required' }, 400);
    }

    const conversation = mockConversations.get(conversationID);
    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    // Update conversation status
    conversation.status = 'editing_recipe';
    conversation.editingRecipeID = recipeID;
    conversation.updatedAt = new Date().toISOString();
    mockConversations.set(conversationID, conversation);

    // Send initial message about the recipe
    const messages = mockMessages.get(conversationID) || [];
    const messageIndex = messages.length;
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const message: ChatMessage = {
      id: messageId,
      conversationID,
      messageIndex,
      role: 'assistant',
      content: `I've loaded your recipe. How would you like to modify it?`,
      timestamp: new Date().toISOString(),
    };

    messages.push(message);
    mockMessages.set(conversationID, messages);

    console.log(`🎭 [MOCK] Loaded recipe ${recipeID} into conversation ${conversationID}`);
    return c.json({ 
      success: true, 
      conversation,
      recipe: {
        id: recipeID,
        title: 'Recipe',
      }
    }, 200);
  } catch (error) {
    console.error('🎭 Error loading recipe into chat:', error);
    return c.json({ error: 'Failed to load recipe into chat' }, 500);
  }
});

/**
 * POST /save-edited-recipe - Save edited recipe (Mock version)
 */
app.post('/save-edited-recipe', async (c) => {
  try {
    const body = await c.req.json();
    const { conversationID, userID } = body;

    if (!conversationID || !userID) {
      return c.json({ error: 'conversationID and userID are required' }, 400);
    }

    const conversation = mockConversations.get(conversationID);
    if (!conversation || conversation.status !== 'editing_recipe') {
      return c.json({ error: 'No recipe being edited in this conversation' }, 400);
    }

    // Update conversation status
    conversation.status = 'recipe_found';
    conversation.updatedAt = new Date().toISOString();
    mockConversations.set(conversationID, conversation);

    console.log(`🎭 [MOCK] Saved edited recipe for conversation ${conversationID}`);
    return c.json({ 
      message: 'Recipe saved successfully! (Mock - recipe not actually saved)'
    }, 201);
  } catch (error) {
    console.error('🎭 Error saving edited recipe:', error);
    return c.json({ error: 'Failed to save edited recipe' }, 500);
  }
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
