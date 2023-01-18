import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useState } from "react";
import AutoResizeTextArea from "../components/AutoResizeTextArea";

import { api } from "../utils/api";
import { PostCard } from "./[userId]/posts/[postId]";

const Home: NextPage = () => {
  const session = useSession();
  const timeline = api.posts.timeline.useQuery();

  const onMutateTimeline = {
    onMutate() {
      setTimeout(() => void timeline.refetch(), 300);
    },
  };

  const createPost = api.posts.create.useMutation(onMutateTimeline);

  const [newPostText, setNewPostText] = useState<string>("");

  const onClickPost = (text: string) => {
    createPost.mutate({ text });
    setNewPostText("");
  };

  if (!session.data || timeline.status === "loading") {
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
      <div className="lg:w-1/2 mx-auto">
        <h1 className="text-3xl mb-4">Home</h1>
        <div className="flex mb-4 flex-col">
          <AutoResizeTextArea
            placeholder="What's happening?"
            value={newPostText}
            onChange={(e) => setNewPostText(e.target.value)}
            className="w-full p-2 bg-purple-900 rounded-md mb-2 h-fit resize-none placeholder-gray-200"
          />
          <button
            className="self-end bg-purple-800 p-2 rounded-md font-bold disabled:opacity-70 hover:opacity-90"
            disabled={newPostText.length === 0}
            onClick={() => onClickPost(newPostText)}
          >
            Post
          </button>
        </div>
        {timeline.data
          .filter((p) => p.repliedToId === null)
          .map((p) => (
            <PostCard
              key={p.id}
              post={p}
              onUpdatePosts={onMutateTimeline}
            />
          ))}
      </div>
    </>
  );
};

export default Home;
