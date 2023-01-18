import { type User } from "@prisma/client";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import AutoResizeTextArea from "../../components/AutoResizeTextArea";
import { api } from "../../utils/api";
import { userSlug } from "../../utils/models";
import { PostCard } from "./posts/[postId]";

const UserPage: NextPage = () => {
  const router = useRouter();
  const session = useSession();

  const isMe = (userId: string) => session.data?.user?.id === userId;

  const userId = router.query.userId;

  const user = api.users.get.useQuery(
    { id: userId as string },
    { enabled: userId !== undefined }
  );

  const iAmFollowing = (user: { followers: User[] }) =>
    user.followers.some((u) => u.id === session.data?.user?.id);

  const onMutateUser = {
    onMutate() {
      setTimeout(() => void user.refetch(), 300);
    },
  };

  const createPost = api.posts.create.useMutation(onMutateUser);
  const followUser = api.users.follow.useMutation(onMutateUser);
  const unfollowUser = api.users.unfollow.useMutation(onMutateUser);
  const editUsername = api.users.editUsername.useMutation(onMutateUser);

  const [newPostText, setNewPostText] = useState<string>("");

  const onClickPost = (text: string) => {
    createPost.mutate({ text, files: [] });
    setNewPostText("");
  };

  const [newUsername, setNewUsername] = useState<string | undefined>(undefined);

  const onClickConfirmNewUsername = (newUsername: string) => {
    editUsername.mutate({ newUsername });
    setNewUsername(undefined);
    window.location.href = `/${newUsername}`;
  };

  const [postPage, setPostPage] = useState<
    "posts" | "postsAndReplies" | "likes"
  >("posts");

  if (user.status === "loading") {
    return <div>loading</div>;
  }

  const userData = user.data;

  if (!userData) {
    return <div>@{userId} - no such user</div>;
  }

  return (
    <>
      <Head>
        <title>{userData.name}</title>
      </Head>
      <div className="mx-auto lg:w-1/2">
        <div className="mb-4">
          {/* eslint-disable-next-line */}
          <img
            className="rounded-full border-4 border-purple-900"
            src={userData.image ?? ""}
            alt="profile picture"
          />
          <h1 className="text-3xl font-bold">{userData.name}</h1>
          {newUsername === undefined && (
            <span className="mr-2 text-purple-400">@{userSlug(userData)}</span>
          )}
          {isMe(userData.id) &&
            (newUsername === undefined ? (
              <>
                <button
                  className="mr-2"
                  onClick={() =>
                    setNewUsername(userData.username ?? userData.id)
                  }
                >
                  Edit Username
                </button>
              </>
            ) : (
              <>
                <input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                />
                <button
                  className="mr-2"
                  disabled={newUsername.length === 0}
                  onClick={() => onClickConfirmNewUsername(newUsername)}
                >
                  Confirm
                </button>
                <button
                  className="mr-2"
                  onClick={() => setNewUsername(undefined)}
                >
                  Cancel
                </button>
              </>
            ))}
          {isMe(userData.id) ||
            (iAmFollowing(userData) ? (
              <button
                onClick={() => unfollowUser.mutate({ userId: userData.id })}
              >
                Unfollow
              </button>
            ) : (
              <button
                onClick={() => followUser.mutate({ userId: userData.id })}
              >
                Follow
              </button>
            ))}
          <div>
            <span className="mr-8 hover:underline">
              <Link href={`/${userSlug(userData)}/following`}>
                <span className="font-bold">{userData.following.length}</span>{" "}
                Following
              </Link>
            </span>
            <span className="hover:underline">
              <Link href={`/${userSlug(userData)}/followers`}>
                <span className="font-bold">{userData.followers.length}</span>{" "}
                Followers
              </Link>
            </span>
          </div>
        </div>
        <div>
          {isMe(userData.id) && (
            <div className="mb-4 flex flex-col">
              <AutoResizeTextArea
                placeholder="What's happening?"
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                className="mb-2 h-fit w-full resize-none rounded-md bg-purple-900 p-2 placeholder-gray-200"
              />
              <button
                className="self-end rounded-md bg-purple-800 p-2 font-bold hover:opacity-90 disabled:opacity-70"
                disabled={newPostText.length === 0}
                onClick={() => onClickPost(newPostText)}
              >
                Post
              </button>
            </div>
          )}
          <div className="mb-2 flex justify-between font-bold">
            <button
              onClick={() => setPostPage("posts")}
              className={postPage === "posts" ? "underline" : ""}
            >
              Posts
            </button>
            <button
              onClick={() => setPostPage("postsAndReplies")}
              className={postPage === "postsAndReplies" ? "underline" : ""}
            >
              Posts and Replies
            </button>
            <button
              onClick={() => setPostPage("likes")}
              className={postPage === "likes" ? "underline" : ""}
            >
              Likes
            </button>
          </div>
          {postPage === "posts" ? (
            <>
              {(userData.posts ?? [])
                .filter((p) => p.repliedToId === null)
                .map((p) => (
                  <PostCard key={p.id} post={p} onUpdatePosts={onMutateUser} />
                ))}
            </>
          ) : postPage === "postsAndReplies" ? (
            <>
              {(userData.posts ?? []).map((p) => (
                <PostCard key={p.id} post={p} onUpdatePosts={onMutateUser} />
              ))}
            </>
          ) : postPage === "likes" ? (
            <>
              {(userData.likes ?? []).map((p) => (
                <PostCard key={p.id} post={p} onUpdatePosts={onMutateUser} />
              ))}
            </>
          ) : (
            <></>
          )}
        </div>
      </div>
    </>
  );
};

export default UserPage;
