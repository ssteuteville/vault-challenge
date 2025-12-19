import { authRouter } from "./router/auth";
import { itemRouter } from "./router/item";
import { pineconeRouter } from "./router/pinecone";
import { postRouter } from "./router/post";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  item: itemRouter,
  post: postRouter,
  pinecone: pineconeRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
