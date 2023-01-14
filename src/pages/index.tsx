import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useState } from "react";

import { api } from "../utils/api";
import { IndividualPost } from "./[userId]/posts/[postId]";

const Home: NextPage = () => {
  const session = useSession();
  const timeline = api.posts.timeline.useQuery();

  const onMutateTimeline = {
    onMutate() {
      setTimeout(() => void timeline.refetch(), 300);
    },
  };

  const createPost = api.posts.create.useMutation(onMutateTimeline);

  const [newPostText, setNewPostText] = useState<string | undefined>(undefined);

  const onClickPost = (text: string) => {
    createPost.mutate({ text });
    setNewPostText(undefined);
  };

  if (!session.data) {
    return <>Please Sign in above</>;
  }

  if (timeline.status === "loading") {
    return <>loading</>;
  }

  if (!timeline.data) {
    return <>fetching timeline failed</>;
  }

  return (
    <>
      <Head>
        <title>Timeline</title>
      </Head>
      <div>
        <h1 className="text-3xl">Timeline</h1>
        {newPostText === undefined ? (
          <button className="mr-2" onClick={() => setNewPostText("")}>
            New Post
          </button>
        ) : (
          <>
            <textarea
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
            />
            <button
              className="mr-2"
              disabled={newPostText.length === 0}
              onClick={() => onClickPost(newPostText)}
            >
              Post
            </button>
            <button className="mr-2" onClick={() => setNewPostText(undefined)}>
              Cancel
            </button>
          </>
        )}
        {timeline.data
          .filter((p) => p.repliedToId === null)
          .map((p) => (
            <IndividualPost
              key={p.id}
              {...p}
              onUpdatePosts={onMutateTimeline}
            />
          ))}
      </div>
    </>
  );
};

export default Home;
