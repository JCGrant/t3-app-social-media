import { type User } from "@prisma/client";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { api } from "../../utils/api";
import { userSlug } from "../../utils/models";
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
    window.location.href = `/${newUsername}`;
  };

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
      <div>
        <div>
          {/* eslint-disable-next-line */}
          <img
            className="rounded-full"
            src={userData.image ?? ""}
            alt="profile picture"
          />
          <h1 className="text-3xl">{userData.name}</h1>
          {newUsername === undefined && <span className="mr-2 text-gray-400">
            @{userData.username ?? userData.id}
          </span>}
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
        </div>
        <div>
          <h2 className="text-xl">Posts</h2>
          {isMe(userData.id) &&
            (newPostText === undefined ? (
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
                <button
                  className="mr-2"
                  onClick={() => setNewPostText(undefined)}
                >
                  Cancel
                </button>
              </>
            ))}
          {(userData.posts ?? [])
            .filter((p) => p.repliedToId === null)
            .map((p) => (
              <IndividualPost key={p.id} {...p} onUpdatePosts={onMutateUser} />
            ))}
          <h2 className="text-xl">Likes</h2>
          {(userData.likes ?? []).map((p) => (
            <IndividualPost key={p.id} {...p} onUpdatePosts={onMutateUser} />
          ))}
          <h2 className="text-xl">Following</h2>
          {(userData.following ?? []).map((u) => (
            <div key={u.id}>
              <Link href={`/${userSlug(u)}`}>
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
          {(userData.followers ?? []).map((u) => (
            <div key={u.id}>
              <Link href={`/${userSlug(u)}`}>
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
