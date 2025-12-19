# Project Prompt

You're helping me with a coding challenge, here is the prompt i was given.

```
Vault: The Ultimate Lending Library Challenge
Prompt
You’re building Vault, a platform for sharing stuff in a community: board games, tools, books, equipment, anything.
Your job is to build a full-stack app that handles a small core of lending flows, and then go wild with whatever features you think make it awesome.
Everyone gets the same core spec. Beyond that, you’re encouraged to specialize and flex in the directions you care about: UX, infra, AI, social features, analytics, etc.
You can use any tech stack and AI tools you like.
How to win
Remember, there are 3 $100 gift cards on the line and nectar points for all. To be considered, you need to fill out this form with a loom to your project and any explanation you might want to have considered by judging. Didn’t finish? That's okay too. Submit a loom with how far you got or what you tried and you’re in for the Nectar points. You have until Monday morning 12/22 at 10am pst to be considered.
```

## Pinecone (Vector Database)

⚠️ **MANDATORY: If you need to help with Pinecone, vector databases, embeddings, semantic search, RAG, or recommendations, you MUST read `.agents/PINECONE.md` first** to determine:

- What questions to ask the user
- How to select the programming language
- Which guide files to consult for implementation details

Do not proceed with Pinecone-related tasks without consulting the appropriate guide files. Use `.agents/PINECONE.md` as your entry point and follow its "Choosing the Right Guide" section to navigate to the appropriate resources.

### Pinecone Instructions Catalog

@./.agents/PINECONE.md
@./.agents/PINECONE-cli.md
@./.agents/PINECONE-python.md
@./.agents/PINECONE-typescript.md
@./.agents/PINECONE-go.md
@./.agents/PINECONE-java.md
@./.agents/PINECONE-quickstart.md
@./.agents/PINECONE-troubleshooting.md

## tRPC Query Patterns

⚠️ **IMPORTANT: When using tRPC queries in React components, DO NOT use `.useQuery()` method directly on tRPC routers.**

The tRPC React context does NOT provide `.useQuery()` methods. Instead, use React Query hooks directly with tRPC query options.

### ❌ WRONG - This will cause "contextMap[utilName] is not a function" error:

```typescript
const { data } = trpc.loan.getFutureReservations.useQuery({ itemId });
```

### ✅ CORRECT - Use `useQuery` from `@tanstack/react-query` with `.queryOptions()`:

```typescript
import { useQuery } from "@tanstack/react-query";

const { data } = useQuery({
  ...trpc.loan.getFutureReservations.queryOptions({ itemId }),
  enabled: open, // optional: add React Query options here
});
```

### ✅ CORRECT - For mutations, use `useMutation` with `.mutationOptions()`:

```typescript
import { useMutation } from "@tanstack/react-query";

const createReservation = useMutation(
  trpc.loan.create.mutationOptions({
    onSuccess: () => {
      /* ... */
    },
    onError: (err) => {
      /* ... */
    },
  }),
);
```

### Reference Examples:

- See `apps/nextjs/src/app/_components/posts.tsx` for query examples
- See `apps/nextjs/src/app/_components/add-item-form.tsx` for mutation examples
