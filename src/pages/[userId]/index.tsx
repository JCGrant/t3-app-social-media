import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import { api } from "../../utils/api";
import { IndividualPost } from "./posts/[postId]";

const UserPage: NextPage = () => {
  const router = useRouter();
  const session = useSession();

  const isMe = (userId: string) => session.data?.user?.id === userId;

  const userId = router.query.userId;

  const user = api.users.get.useQuery(
    { id: userId as string },
    { enabled: userId !== undefined }
  );

  const onMutateUser = {
    onMutate() {
      setTimeout(() => void user.refetch(), 300);
    },
  };

  const createPost = api.posts.create.useMutation(onMutateUser);
  const [newPostText, setNewPostText] = useState<string | undefined>(undefined);

  const onClickPost = (text: string) => {
    createPost.mutate({ text });
    setNewPostText(undefined);
  };

  if (user.status === "loading") {
    return <div>loading</div>;
  }

  if (!user.data) {
    return <div>@{userId} - no such user</div>;
  }

  return (
    <>
      <Head>
        <title>{user.data.name}</title>
      </Head>
      <div>
        <div>
          {/* eslint-disable-next-line */}
          <img
            className="rounded-full"
            src={user.data.image ?? ""}
            alt="profile picture"
          />
          <h1 className="text-3xl">{user.data.name}</h1>
          <span className="text-gray-400">@{user.data.id}</span>
        </div>
        <div>
          <h2 className="text-xl">Posts</h2>
          {isMe(user.data.id) &&
            (newPostText === undefined ? (
              <button className="mr-2" onClick={() => setNewPostText("")}>
                New Post
              </button>
            ) : (
              <>
                <textarea
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                ></textarea>
                <button
                  className="mr-2"
                  disabled={newPostText.length === 0}
                  onClick={() => onClickPost(newPostText)}
                >
                  Post
                </button>
                <button
                  className="mr-2"
                  onClick={() => setNewPostText(undefined)}
                >
                  Cancel
                </button>
              </>
            ))}
          {(user.data.posts ?? [])
            .filter((p) => p.repliedToId === null)
            .map((p) => (
              <IndividualPost
                key={p.id}
                {...p}
                onUpdatePosts={onMutateUser}
              />
            ))}
        </div>
      </div>
    </>
  );
};

export default UserPage;
