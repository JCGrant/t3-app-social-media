import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useRef, useState } from "react";
import AutoResizeTextArea from "../components/AutoResizeTextArea";

import { api } from "../utils/api";
import { userSlug } from "../utils/models";
import { PostCard } from "./[userId]/posts/[postId]";

type NewPost = {
  text: string;
  files: File[];
};

const Home: NextPage = () => {
  const session = useSession();
  const timeline = api.posts.timeline.useQuery();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const onMutateTimeline = {
    onSuccess() {
      void timeline.refetch()
    },
  };

  const createPost = api.posts.create.useMutation({
    async onSuccess({ presignedURLs }) {
      await Promise.all(
        presignedURLs.map(({ url }, i) => {
          const file = newPost.files[i];
          if (!file) {
            return;
          }
          return fetch(url, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": file.type,
              "x-amz-acl": "public-read",
            },
          });
        })
      );
      void timeline.refetch();
    },
  });

  const [newPost, setNewPost] = useState<NewPost>({ text: "", files: [] });

  const onClickPost = (newPost: NewPost) => {
    createPost.mutate({
      text: newPost.text,
      files: newPost.files.map((f) => ({ name: f.name, type: f.type })),
    });
    setNewPost({ text: "", files: [] });
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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
      <div className="mx-auto lg:w-1/2">
        <h1 className="mb-4 text-3xl">Home</h1>
        <div className="mb-4">
          <AutoResizeTextArea
            placeholder="What's happening?"
            value={newPost.text}
            onChange={(e) => setNewPost({ ...newPost, text: e.target.value })}
            className="mb-2 h-fit w-full resize-none rounded-md bg-purple-900 p-2 placeholder-gray-200"
          />
          <div className="flex justify-between">
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) =>
                setNewPost({
                  ...newPost,
                  files: e.target.files ? Array.from(e.target.files) : [],
                })
              }
            />
            <button
              className="self-end rounded-md bg-purple-800 p-2 font-bold hover:opacity-90 disabled:opacity-70"
              disabled={newPost.text.length === 0 && newPost.files.length === 0}
              onClick={() => onClickPost(newPost)}
            >
              Post
            </button>
          </div>
        </div>
        {createPost.isLoading && (
          <div className="mb-2 rounded-md border-b-2 border-b-purple-900 bg-purple-800 p-4 pb-2">
            Creating Post...
          </div>
        )}
        {timeline.data
          .filter((p) => p.repliedToId === null)
          .map((p) => (
            <PostCard key={p.id} post={p} onUpdatePosts={onMutateTimeline} />
          ))}
      </div>
    </>
  );
};

export default Home;
