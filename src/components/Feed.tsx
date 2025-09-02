import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import PostCard from "./PostCard";
import "../styles/Feed.css";
import Spinner from "./Spinner";

interface TopPost {
  _id: Id<"post">;
  subject: string;
  body?: string;
  _creationTime: number;
  authorId: Id<"users">;
  author: { username: string };
  subreddit: { name: string };
  score: number;
  upvotes: number;
  downvotes: number;
  imageUrl?: string;
}

export function Feed() {
  const [randomSalt] = useState(() => Date.now());
  const topPosts = useQuery(api.leaderboard.getTopPosts, { limit: 2 }) as TopPost[] | undefined;
  const recommended = useQuery(api.recommendations.getRecommendations, { limit: 10 }) as TopPost[] | undefined;
  const randomPosts = useQuery(api.recommendations.getRandomPosts, { limit: 5, salt: randomSalt }) as any[] | undefined;

  if (!topPosts || recommended === undefined || randomPosts === undefined) {
    return (
      <div className="loading-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="content-grid two-col">
      <div className="column-left">
        <div className="feed-container">
          <h2 className="section-title">Top Voted This Month</h2>
          <div className="posts-list">
            {topPosts.map((post) => {
              const postData = {
                _id: post._id,
                subject: post.subject,
                body: post.body,
                _creationTime: post._creationTime,
                authorId: post.authorId,
                author: post.author,
                subreddit: post.subreddit,
                imageUrl: post.imageUrl,
              };
              return (
                <PostCard key={post._id} post={postData} showSubreddit={true} />
              );
            })}
          </div>
        </div>

        <div className="feed-container">
          <h2 className="section-title">You May Like</h2>
          <div className="posts-list">
            {(recommended ?? []).map((post) => {
              const postData = {
                _id: post._id,
                subject: post.subject,
                body: post.body,
                _creationTime: post._creationTime,
                authorId: post.authorId,
                author: post.author,
                subreddit: post.subreddit,
                imageUrl: post.imageUrl,
              };
              return (
                <PostCard key={post._id} post={postData} showSubreddit={true} />
              );
            })}
            {recommended && recommended.length === 0 && (
              <div>No recommendations yet. Try searching for communities.</div>
            )}
          </div>
        </div>
      </div>

      <div className="column-right">
        <div className="feed-container">
          <h2 className="section-title">Random Posts</h2>
          <div className="posts-list">
            {(randomPosts ?? []).map((post) => {
              const postData = {
                _id: post._id,
                subject: post.subject,
                body: post.body,
                _creationTime: post._creationTime,
                authorId: post.authorId,
                author: post.author,
                subreddit: post.subreddit,
                imageUrl: post.imageUrl,
              };
              return (
                <PostCard key={post._id} post={postData} showSubreddit={true} />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}