import { query } from "./_generated/server";
import { v } from "convex/values";
import { counts } from "./counter";
import { voteKey } from "./vote";

export const getTopPosts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    const now = new Date();
    // Last 30 days (approximate one month)
    const oneMonthAgo = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30);
    const posts = await ctx.db
      .query("post")
      .withIndex("by_creation_time")
      .filter((q) => q.gt(q.field("_creationTime"), oneMonthAgo.getTime()))
      .collect();

    const postWithScores = await Promise.all(
      posts.map(async (post) => {
        const upvotes = await counts.count(ctx, voteKey(post._id, "upvote"));
        const downvotes = await counts.count(
          ctx,
          voteKey(post._id, "downvote")
        );

        const author = await ctx.db.get(post.authorId);
        const subreddit = await ctx.db.get(post.subreddit);
        const image = post.image && (await ctx.storage.getUrl(post.image));

        return {
          ...post,
          score: upvotes - downvotes,
          upvotes,
          downvotes,
          author: { username: author?.username ?? "[deleted]" },
          subreddit: { name: subreddit?.name ?? "[deleted]" },
          imageUrl: image ?? undefined,
        };
      })
    );

    return postWithScores.sort((a, b) => b.score - a.score).slice(0, limit);
  },
});
