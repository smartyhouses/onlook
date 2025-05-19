import { relations, sql } from 'drizzle-orm';
import { pgPolicy, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { authenticatedRole } from "drizzle-orm/supabase";
import { createInsertSchema } from 'drizzle-zod';
import { userProjects } from '../user';
import { canvases } from './canvas';
import { conversations, PROJECT_CONVERSATION_RELATION_NAME } from './chat/conversation';

export const projects = pgTable("projects", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name").notNull(),
    sandboxId: varchar("sandbox_id").notNull(),
    sandboxUrl: varchar("sandbox_url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    previewImg: varchar("preview_img"),
    description: text("description"),
}, (table) => [
    pgPolicy('policy', {
        as: 'restrictive',
        to: authenticatedRole,
        using: sql`EXISTS (
            SELECT 1 FROM user_projects
            WHERE user_projects.project_id = ${table.id}
              AND user_projects.user_id = auth.uid()
        )`,
    }),
]
).enableRLS();

export const projectInsertSchema = createInsertSchema(projects);

export const projectRelations = relations(projects, ({ one, many }) => ({
    canvas: one(canvases, {
        fields: [projects.id],
        references: [canvases.projectId],
    }),
    userProjects: many(userProjects),
    conversations: many(conversations, {
        relationName: PROJECT_CONVERSATION_RELATION_NAME,
    }),
}));

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
