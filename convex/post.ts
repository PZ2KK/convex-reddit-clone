import { mutation, query, QueryCtx } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { getCurrentUserOrThrow } from "./users";

export const create = mutation({
    args: {
            subject: v.string(),
            body: v.optional(v.string()),
            subreddit: v.id("subreddit"),
            storageId: v.optional(v.id("_storage"))
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUserOrThrow(ctx);
        const postId = await ctx.db.insert("post", {
            subject: args.subject,
            body: args.body,
            subreddit: args.subreddit,
            authorId: user._id,
            image: args.storageId || undefined
        })
        return postId
    },
});