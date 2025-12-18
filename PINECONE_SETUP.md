# Pinecone Setup Guide

This guide will help you get started with Pinecone in your project.

## Prerequisites

1. **Pinecone API Key**: Get your API key from [https://app.pinecone.io/](https://app.pinecone.io/)
2. **Pinecone CLI**: Already installed ✅
3. **Pinecone SDK**: Already installed ✅ (`@pinecone-database/pinecone@6.1.3`)

## Quick Start

### 1. Set Up Environment Variables

Create a `.env` file in the project root (if it doesn't exist) and add your Pinecone API key:

```bash
PINECONE_API_KEY=your-api-key-here
```

The Next.js app will automatically load this via `dotenv-cli` (configured in `package.json`).

### 2. Create Your First Index

You have four options for creating a Pinecone index:

#### Option A: Using Pinecone CLI (Recommended for Quick Start)

```bash
pc index create -n my-first-index -m cosine -c aws -r us-east-1 \
  --model llama-text-embed-v2 \
  --field_map text=content
```

#### Option B: Using Web Console

1. Go to [https://app.pinecone.io/](https://app.pinecone.io/)
2. Click "Create Index"
3. Configure:
   - **Name**: `my-first-index`
   - **Metric**: `cosine`
   - **Cloud**: `aws`
   - **Region**: `us-east-1`
   - **Embedding Model**: `llama-text-embed-v2`
   - **Field Map**: `text=content`

#### Option C: Auto-create in Application Code

See `packages/api/src/utils/pinecone.ts` for client setup, then add index creation logic.

#### Option D: Dedicated Setup Script

Create a script that checks if the index exists and creates it if needed.

### 3. Use Pinecone in Your Application

The Pinecone integration is already set up in your tRPC API. You can use it via:

```typescript
// In your frontend or API calls
const results = await trpc.pinecone.search.query({
  indexName: "my-first-index",
  namespace: "example-namespace",
  query: "Famous historical structures",
  topK: 10,
});
```

## Available tRPC Procedures

### `pinecone.search`
Semantic search with reranking for better results.

**Input:**
- `indexName`: Name of your Pinecone index
- `namespace`: Namespace to search in (required for data isolation)
- `query`: Search query text
- `topK`: Number of results to return (default: 10)

**Example:**
```typescript
const results = await trpc.pinecone.search.query({
  indexName: "my-first-index",
  namespace: "example-namespace",
  query: "Famous historical structures and monuments",
  topK: 5,
});
```

### `pinecone.upsert`
Add or update records in your index. Records are automatically embedded.

**Input:**
- `indexName`: Name of your Pinecone index
- `namespace`: Namespace to upsert into (required)
- `records`: Array of records (max 96 per batch)
  - `_id`: Unique identifier
  - `content`: Text content (must match `field_map` from index creation)
  - `category`: Optional category field

**Example:**
```typescript
await trpc.pinecone.upsert.mutate({
  indexName: "my-first-index",
  namespace: "example-namespace",
  records: [
    {
      _id: "rec1",
      content: "The Eiffel Tower was completed in 1889 and stands in Paris, France.",
      category: "history",
    },
    {
      _id: "rec2",
      content: "Photosynthesis allows plants to convert sunlight into energy.",
      category: "science",
    },
  ],
});
```

**Important:** After upserting, wait 10+ seconds before searching to allow indexing.

### `pinecone.stats`
Get statistics about your index.

**Input:**
- `indexName`: Name of your Pinecone index

**Example:**
```typescript
const stats = await trpc.pinecone.stats.query({
  indexName: "my-first-index",
});
```

## Quick Test Example

Here's a complete example to test your setup:

1. **Create an index:**
```bash
pc index create -n quickstart-test -m cosine -c aws -r us-east-1 \
  --model llama-text-embed-v2 \
  --field_map text=content
```

2. **Wait for index to be ready** (check with `pc index list`)

3. **Upsert sample data** (via tRPC or directly in code):
```typescript
const sampleRecords = [
  {
    _id: "rec1",
    content: "The Eiffel Tower was completed in 1889 and stands in Paris, France.",
    category: "history",
  },
  {
    _id: "rec2",
    content: "Photosynthesis allows plants to convert sunlight into energy.",
    category: "science",
  },
  {
    _id: "rec5",
    content: "Shakespeare wrote many famous plays, including Hamlet and Macbeth.",
    category: "literature",
  },
  // ... add more records
];

await trpc.pinecone.upsert.mutate({
  indexName: "quickstart-test",
  namespace: "test-namespace",
  records: sampleRecords,
});
```

4. **Wait 10+ seconds** for indexing

5. **Search:**
```typescript
const results = await trpc.pinecone.search.query({
  indexName: "quickstart-test",
  namespace: "test-namespace",
  query: "Famous historical structures and monuments",
  topK: 5,
});
```

## Common CLI Commands

```bash
# List all indexes
pc index list

# Describe an index
pc index describe --name my-first-index

# Delete an index
pc index delete --name my-first-index

# Check CLI version
pc version
```

## Important Notes

1. **Always use namespaces**: Every operation requires a namespace for data isolation
2. **Wait after upsert**: Wait 10+ seconds after upserting before searching
3. **Batch limits**: Max 96 records per batch for text records
4. **Field mapping**: The `content` field must match your `--field_map` configuration
5. **Metadata**: Must be flat (no nested objects)

## Next Steps

- **Semantic Search**: Build a search system for your knowledge base
- **RAG System**: Build a multi-tenant RAG system with LLM integration
- **Recommendations**: Build a recommendation engine using semantic similarity

For more details, see the Pinecone documentation files in `.agents/`:
- `PINECONE-quickstart.md` - Complete quickstart guide
- `PINECONE-typescript.md` - TypeScript-specific patterns
- `PINECONE.md` - Universal concepts and best practices

## Troubleshooting

- **"PINECONE_API_KEY not set"**: Make sure your `.env` file exists and contains `PINECONE_API_KEY`
- **"Index not found"**: Verify the index exists with `pc index list`
- **No search results**: Wait 10+ seconds after upserting, check namespace matches
- **Rate limit errors**: Implement exponential backoff retry logic

For more troubleshooting help, see `.agents/PINECONE-troubleshooting.md`.

