import { type User } from "@prisma/client";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
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

  const [newPostText, setNewPostText] = useState<string | undefined>(undefined);

  const onClickPost = (text: string) => {
    createPost.mutate({ text });
    setNewPostText(undefined);
  };

  const [newUsername, setNewUsername] = useState<string | undefined>(undefined);

  const onClickConfirmNewUsername = (newUsername: string) => {
    editUsername.mutate({ newUsername });
    setNewUsername(undefined);
    window.location.href = `/${newUsername}`
  }

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
          {isMe(user.data.id) &&
            (newUsername === undefined ? (
              <>
                <span className="text-gray-400 mr-2">@{user.data.username ?? user.data.id}</span>
                <button
                  className="mr-2"
                  onClick={() => setNewUsername(user.data!.username ?? user.data!.id)}>
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
          {isMe(user.data.id) ||
            (iAmFollowing(user.data) ? (
              <button
                onClick={() => unfollowUser.mutate({ userId: user.data!.id })}
              >
                Unfollow
              </button>
            ) : (
              <button
                onClick={() => followUser.mutate({ userId: user.data!.id })}
              >
                Follow
              </button>
            ))}
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
              <IndividualPost key={p.id} {...p} onUpdatePosts={onMutateUser} />
            ))}
          <h2 className="text-xl">Likes</h2>
          {(user.data.likes ?? []).map((p) => (
            <IndividualPost key={p.id} {...p} onUpdatePosts={onMutateUser} />
          ))}
          <h2 className="text-xl">Following</h2>
          {(user.data.following ?? []).map((u) => (
            <div key={u.id}>
              <Link href={`/${u.id}`}>
                {/* eslint-disable-next-line */}
                <img
                  className="inline w-10 rounded-full"
                  src={u.image ?? ""}
                  alt="profile picture"
                />
                <span className="mr-2">{u.name}</span>
              </Link>
            </div>
          ))}
          <h2 className="text-xl">Followers</h2>
          {(user.data.followers ?? []).map((u) => (
            <div key={u.id}>
              <Link href={`/${u.id}`}>
                {/* eslint-disable-next-line */}
                <img
                  className="inline w-10 rounded-full"
                  src={u.image ?? ""}
                  alt="profile picture"
                />
                <span className="mr-2">{u.name}</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default UserPage;
