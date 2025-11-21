import { CosmosClient, Container, Database } from '@azure/cosmos';

let cosmosClient: CosmosClient | null = null;
let database: Database | null = null;

const containers = {
  chatConversations: null as Container | null,
  chatMessages: null as Container | null,
  userProfiles: null as Container | null,
  recipes: null as Container | null,
  pantries: null as Container | null,
  groceryLists: null as Container | null,
  groceryItems: null as Container | null,
  tutorials: null as Container | null,
  mealTracking: null as Container | null,
};

/**
 * Initialize Cosmos DB connection
 */
export function initCosmosDB() {
  if (!process.env.COSMOS_ENDPOINT || !process.env.COSMOS_KEY) {
    console.warn('Cosmos DB credentials not configured. Chat features will be disabled.');
    return null;
  }

  try {
    cosmosClient = new CosmosClient({
      endpoint: process.env.COSMOS_ENDPOINT,
      key: process.env.COSMOS_KEY,
    });

    database = cosmosClient.database('plateful-core');

    containers.chatConversations = database.container('chat-conversations');
    containers.chatMessages = database.container('chat-messages');
    containers.userProfiles = database.container('user-profiles');
    containers.recipes = database.container('recipes');
    containers.pantries = database.container('pantries');
    containers.groceryLists = database.container('grocery-lists');
    containers.groceryItems = database.container('grocery-items');
    containers.tutorials = database.container('tutorials');
    containers.mealTracking = database.container('meal-tracking');

    console.log('✅ Cosmos DB initialized successfully');
    return cosmosClient;
  } catch (error) {
    console.error('Failed to initialize Cosmos DB:', error);
    return null;
  }
}

/**
 * Get a specific container
 */
export function getContainer(name: keyof typeof containers): Container | null {
  if (!containers[name]) {
    console.warn(`Container ${name} not initialized`);
  }
  return containers[name];
}

/**
 * Check if Cosmos DB is available
 */
export function isCosmosAvailable(): boolean {
  return cosmosClient !== null && database !== null;
}

/**
 * Generate a unique ID
 */
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

