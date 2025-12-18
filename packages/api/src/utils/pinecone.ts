import { Pinecone } from "@pinecone-database/pinecone";

// Initialize Pinecone client
// API key should be loaded from environment variables
const apiKey = process.env.PINECONE_API_KEY;
if (!apiKey) {
  throw new Error("PINECONE_API_KEY environment variable not set");
}

export const pinecone = new Pinecone({ apiKey });

/**
 * Get a Pinecone index instance
 * @param indexName - Name of the index to access
 * @returns Index instance
 */
export function getIndex(indexName: string) {
  return pinecone.index(indexName);
}
