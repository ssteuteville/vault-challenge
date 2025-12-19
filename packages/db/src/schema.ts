import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { account, session, user } from "./auth-schema";

export const Post = pgTable("post", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  title: t.varchar({ length: 256 }).notNull(),
  content: t.text().notNull(),
  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => sql`now()`),
}));

export const CreatePostSchema = createInsertSchema(Post, {
  title: z.string().max(256),
  content: z.string().max(256),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Enums
export const itemStatusEnum = pgEnum("item_status", [
  "available",
  "borrowed",
  "unavailable",
]);

export const loanStatusEnum = pgEnum("loan_status", [
  "pending",
  "approved",
  "active",
  "returned",
  "cancelled",
  "rejected",
]);

// Items table
export const items = pgTable(
  "items",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 256 }).notNull(),
    description: text("description").notNull(),
    category: varchar("category", { length: 100 }),
    imageUrl: text("image_url"),
    requiresApproval: boolean("requires_approval").default(true).notNull(),
    status: itemStatusEnum("status").notNull().default("available"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .$onUpdateFn(() => sql`now()`)
      .notNull(),
  },
  (table) => [
    index("items_owner_id_idx").on(table.ownerId),
    index("items_status_idx").on(table.status),
  ],
);

// Loans table
export const loans = pgTable(
  "loans",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    borrowerId: text("borrower_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: loanStatusEnum("status").notNull().default("pending"),
    requestedAt: timestamp("requested_at").defaultNow().notNull(),
    approvedAt: timestamp("approved_at", { mode: "date", withTimezone: true }),
    borrowedAt: timestamp("borrowed_at", { mode: "date", withTimezone: true }),
    dueDate: timestamp("due_date", { mode: "date", withTimezone: true }),
    returnedAt: timestamp("returned_at", { mode: "date", withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .$onUpdateFn(() => sql`now()`)
      .notNull(),
  },
  (table) => [
    index("loans_item_id_idx").on(table.itemId),
    index("loans_borrower_id_idx").on(table.borrowerId),
    index("loans_status_idx").on(table.status),
  ],
);

// Relations
export const itemRelations = relations(items, ({ one, many }) => ({
  owner: one(user, {
    fields: [items.ownerId],
    references: [user.id],
  }),
  loans: many(loans),
}));

export const loanRelations = relations(loans, ({ one }) => ({
  item: one(items, {
    fields: [loans.itemId],
    references: [items.id],
  }),
  borrower: one(user, {
    fields: [loans.borrowerId],
    references: [user.id],
  }),
}));

// Extend userRelations to include items and loans
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  items: many(items),
  loans: many(loans),
}));

// Zod schemas
export const CreateItemSchema = createInsertSchema(items, {
  title: z.string().max(256),
  description: z.string(),
  category: z.string().max(100).optional(),
  imageUrl: z
    .union([z.string().url(), z.literal("")])
    .optional()
    .nullable(),
  requiresApproval: z.boolean(),
  status: z.enum(["available", "borrowed", "unavailable"]),
}).omit({
  id: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateItemSchema = createInsertSchema(items, {
  title: z.string().max(256).optional(),
  description: z.string().optional(),
  category: z.string().max(100).optional().nullable(),
  imageUrl: z
    .union([z.string().url(), z.literal("")])
    .optional()
    .nullable(),
  requiresApproval: z.boolean().optional(),
  status: z.enum(["available", "borrowed", "unavailable"]).optional(),
}).omit({
  id: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateLoanSchema = createInsertSchema(loans, {
  status: z.enum([
    "pending",
    "approved",
    "active",
    "returned",
    "cancelled",
    "rejected",
  ]),
  notes: z.string().optional().nullable(),
  dueDate: z.date().optional().nullable(),
}).omit({
  id: true,
  requestedAt: true,
  approvedAt: true,
  borrowedAt: true,
  returnedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateLoanSchema = createInsertSchema(loans, {
  status: z
    .enum([
      "pending",
      "approved",
      "active",
      "returned",
      "cancelled",
      "rejected",
    ])
    .optional(),
  approvedAt: z.date().optional().nullable(),
  borrowedAt: z.date().optional().nullable(),
  dueDate: z.date().optional().nullable(),
  returnedAt: z.date().optional().nullable(),
  notes: z.string().optional().nullable(),
}).omit({
  id: true,
  itemId: true,
  borrowerId: true,
  requestedAt: true,
  createdAt: true,
  updatedAt: true,
});

export * from "./auth-schema";
