import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { getIndex } from "../utils/pinecone";

export const pineconeRouter = createTRPCRouter({
  /**
   * Quick test: Search for semantically similar documents
   * This demonstrates basic Pinecone usage with semantic search and reranking
   */
  search: publicProcedure
    .input(
      z.object({
        indexName: z.string().min(1),
        namespace: z.string().min(1),
        query: z.string().min(1),
        topK: z.number().min(1).max(100).default(10),
      }),
    )
    .query(async ({ input }) => {
      const { indexName, namespace, query, topK } = input;
      const index = getIndex(indexName);

      // Search with reranking for better results
      const results = await index.namespace(namespace).searchRecords({
        query: {
          topK: topK * 2, // Get 2x candidates for reranking
          inputs: {
            text: query,
          },
        },
        rerank: {
          model: "bge-reranker-v2-m3",
          topN: topK,
          rankFields: ["content"],
        },
      });

      // Format results with proper type casting
      return results.result.hits.map((hit) => {
        const fields = hit.fields as Record<string, any>;
        return {
          id: hit._id,
          score: hit._score,
          content: String(fields?.content ?? ""),
          category: String(fields?.category ?? "unknown"),
          metadata: fields,
        };
      });
    }),

  /**
   * Upsert records into a Pinecone index
   * Records will be automatically embedded using the index's integrated embedding model
   */
  upsert: publicProcedure
    .input(
      z.object({
        indexName: z.string().min(1),
        namespace: z.string().min(1),
        records: z.array(
          z.object({
            _id: z.string(),
            content: z.string(), // Must match field_map from index creation
            category: z.string().optional(),
            // Add other fields as needed - must match field_map
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      const { indexName, namespace, records } = input;
      const index = getIndex(indexName);

      // Validate batch size (max 96 records for text records)
      if (records.length > 96) {
        throw new Error("Batch size exceeds limit of 96 records");
      }

      await index.namespace(namespace).upsertRecords(records);

      return {
        success: true,
        count: records.length,
        message: `Successfully upserted ${records.length} records`,
      };
    }),

  /**
   * Get index statistics
   */
  stats: publicProcedure
    .input(
      z.object({
        indexName: z.string().min(1),
      }),
    )
    .query(async ({ input }) => {
      const { indexName } = input;
      const index = getIndex(indexName);
      const stats = await index.describeIndexStats();
      return stats;
    }),
});

