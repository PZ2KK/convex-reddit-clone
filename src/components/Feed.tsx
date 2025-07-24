import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import PostCard from "./PostCard";
import "../styles/Feed.css";

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
  const topPosts = useQuery(api.leaderboard.getTopPosts, { limit: 10 }) as TopPost[] | undefined;

  if (!topPosts) {
    return <div className="context-grid"> Loading...</div>;
  }

  return (
    <div className="context-grid">
      <div className="feed-container">
        <h2 className="section-title">Trending Today</h2>
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
              imageUrl: post.imageUrl
            };
            return (
              <PostCard 
                key={post._id} 
                post={postData} 
                showSubreddit={true} 
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}