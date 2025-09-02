import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserOrThrow } from "./users";
import type { Id, Doc } from "./_generated/dataModel";
import { counts } from "./counter";
import { voteKey } from "./vote";
import { getEnrichedPosts } from "./post";

export const logSearch = mutation({
  args: { term: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const now = Date.now();

    const existing = await ctx.db
      .query("search_history")
      .withIndex("byUserTerm", (q) => q.eq("userId", user._id).eq("term", args.term))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { lastSearchedAt: now });
    } else {
      await ctx.db.insert("search_history", {
        userId: user._id,
        term: args.term,
        lastSearchedAt: now,
      });
    }
  },
});

export const getRandomPosts = query({
  args: { limit: v.optional(v.number()), salt: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(50, args.limit ?? 5));

    // Collect a reasonable amount to sample from (avoid huge scans)
    const all = await ctx.db.query("post").collect();
    if (all.length === 0) return [] as Awaited<ReturnType<typeof getEnrichedPosts>>;

    // Shuffle (Fisher-Yates) and take 'limit'
    const arr = [...all];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const sampled = arr.slice(0, limit);

    return await getEnrichedPosts(ctx, sampled);
  },
});

export const getRecommendations = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      return [] as Array<Doc<"post"> & { score: number; author?: { username: string }; subreddit?: { name: string }; imageUrl?: string }>;
    }

    const limit = args.limit ?? 10;

    const convexUser = await ctx.db
      .query("users")
      .withIndex("byExternalId", (q) => q.eq("externalId", user.subject))
      .unique();
    if (!convexUser) return [];

    const searches = await ctx.db
      .query("search_history")
      .withIndex("byUser", (q) => q.eq("userId", convexUser._id))
      .collect();

    const recentTerms = searches
      .sort((a, b) => b.lastSearchedAt - a.lastSearchedAt)
      .slice(0, 5)
      .map((s) => s.term);

    if (recentTerms.length === 0) return [];

    // Find subreddits matching recent terms
    const matchedSubreddits = new Map<string, Id<"subreddit">>();
    for (const term of recentTerms) {
      const subs = await ctx.db
        .query("subreddit")
        .withSearchIndex("search_body", (q) => q.search("name", term))
        .take(5);
      for (const s of subs) {
        matchedSubreddits.set(s.name, s._id);
      }
    }

    if (matchedSubreddits.size === 0) return [];

    // Collect posts from matched subreddits
    const posts: Doc<"post">[] = [];
    for (const [_name, subId] of matchedSubreddits) {
      const p = await ctx.db
        .query("post")
        .withIndex("bySubreddit", (q) => q.eq("subreddit", subId))
        .collect();
      posts.push(...p);
    }

    // Score posts similar to leaderboard
    const postWithScores = await Promise.all(
      posts.map(async (post) => {
        const upvotes = await counts.count(ctx, voteKey(post._id, "upvote"));
        const downvotes = await counts.count(ctx, voteKey(post._id, "downvote"));
        const author = await ctx.db.get(post.authorId);
        const subreddit = await ctx.db.get(post.subreddit);
        const image = post.image && (await ctx.storage.getUrl(post.image));
        return {
          ...post,
          score: upvotes - downvotes,
          author: author ? { username: author.username } : undefined,
          subreddit: subreddit ? { name: subreddit.name } : undefined,
          imageUrl: image ?? undefined,
        };
      })
    );

    return postWithScores
      .sort((a, b) => b.score - a.score || b._creationTime - a._creationTime)
      .slice(0, limit);
  },
});
