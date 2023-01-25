import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { api } from "../../utils/api";
import { userSlug } from "../../utils/models";

const FollowersPage = () => {
  return <UserListPage relationship="followers" />;
};

export default FollowersPage;

export type UserListProps = {
  relationship: "followers" | "following";
};

export const UserListPage: React.FC<UserListProps> = ({ relationship }) => {
  const router = useRouter();
  const session = useSession();

  const isMe = (userId: string) => session.data?.user?.id === userId;

  const userId = router.query.userId;

  const user = api.users.get.useQuery(
    { id: userId as string },
    { enabled: userId !== undefined }
  );

  const iAmFollowing = (other: { id: string }) =>
    user.data?.followers.some((u) => u.id === other.id);

  const onMutateUser = {
    onSuccess() {
      void user.refetch();
    },
  };

  const followUser = api.users.follow.useMutation(onMutateUser);
  const unfollowUser = api.users.unfollow.useMutation(onMutateUser);

  const userData = user.data;

  if (!userData) {
    return <div>@{userId} - no such user</div>;
  }

  return (
    <>
      <Head>
        <title>{userData.name} Followers</title>
      </Head>
      <Link href={`/${userSlug(userData)}`}>
        <div className="mb-4 flex items-center hover:opacity-90">
          <div className="mr-4 text-2xl font-bold">{"<-"}</div>
          <div>
            <h1 className="text-3xl font-bold">{userData.name}</h1>
            <span className="mr-2 text-purple-400">@{userSlug(userData)}</span>
          </div>
        </div>
      </Link>
      <div className="mx-auto lg:w-1/2">
        {(userData[relationship] ?? []).map((u) => (
          <div key={u.id}>
            <div className="flex items-center justify-between rounded-md bg-purple-800 p-2 hover:opacity-90">
              <Link href={`/${userSlug(u)}`}>
                <div className="flex">
                  <div>
                    {/* eslint-disable-next-line */}
                    <img
                      className="mr-2 inline w-14 rounded-full border-2 border-purple-900"
                      src={u.image ?? ""}
                      alt="profile picture"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="mr-2">{u.name}</span>
                    <span className="mr-2 text-purple-400">@{userSlug(u)}</span>
                  </div>
                </div>
              </Link>
              <div>
                {isMe(u.id) ||
                  (iAmFollowing(u) ? (
                    <button
                      onClick={() => unfollowUser.mutate({ userId: u.id })}
                    >
                      Unfollow
                    </button>
                  ) : (
                    <button onClick={() => followUser.mutate({ userId: u.id })}>
                      Follow
                    </button>
                  ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
