import { type User, type Post } from "@prisma/client";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { api } from "../../../utils/api";

const PostPage = () => {
  const router = useRouter();

  const postId = router.query.postId;

  const post = api.posts.get.useQuery(
    { id: postId as string },
    { enabled: postId !== undefined }
  );

  const onMutatePost = {
    onMutate() {
      setTimeout(() => void post.refetch(), 300);
    },
  };

  if (post.status === "loading") {
    return <div>loading</div>;
  }

  if (!post.data) {
    return <div>@{postId} - no such post</div>;
  }

  return (
    <>
      <Head>
        <title>
          {post.data.user.name} - {post.data.text}
        </title>
      </Head>
      <div>
        <Link href={`/${post.data.user.id}`}>
          <div>
            {/* eslint-disable-next-line */}
            <img
              className="rounded-full"
              src={post.data.user.image ?? ""}
              alt="profile picture"
            />
            <h1 className="text-3xl">{post.data.user.name}</h1>
            <span className="text-gray-400">@{post.data.user.id}</span>
          </div>
        </Link>
        <div>
          <IndividualPost
            {...post.data}
            onUpdatePosts={onMutatePost}
          />
          <h2 className="text-xl">Replies</h2>
          {(post.data.replies ?? []).map((p) => (
            <IndividualPost
              key={p.id}
              {...p}
              onUpdatePosts={onMutatePost}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default PostPage;

export type PostProps = Post & {
  user: User;
  likes: User[];
  reposts: Post[];
  replies: Post[];
  repost:
  | (Post & {
    user: User;
    likes: User[];
    reposts: Post[];
    replies: Post[];
  })
  | null;
  onUpdatePosts: { onMutate: () => void };
};

export const IndividualPost: React.FC<PostProps> = ({
  id,
  userId,
  user,
  text,
  likes,
  reposts,
  replies,
  repost,
  onUpdatePosts,
}) => {
  const session = useSession();

  const isMe = (userId: string) => session.data?.user?.id === userId;

  const iHaveLiked = (post: { likes: User[] }) =>
    post.likes.some(({ id }) => id === session.data?.user?.id);

  const [editingText, setEditingText] = useState<string | undefined>(undefined);
  const [replyText, setReplyText] = useState<string | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);

  const repostPost = api.posts.repost.useMutation(onUpdatePosts);
  const replyToPost = api.posts.replyTo.useMutation(onUpdatePosts);
  const editPost = api.posts.edit.useMutation(onUpdatePosts);
  const deletePost = api.posts.delete.useMutation(onUpdatePosts);
  const likePost = api.posts.like.useMutation(onUpdatePosts);
  const unlikePost = api.posts.unlike.useMutation(onUpdatePosts);

  const onConfirmEditingText = (text: string) => {
    editPost.mutate({ postId: id, text });
    setEditingText(undefined);
  };

  const onClickPostReply = (repliedToId: string, text: string) => {
    replyToPost.mutate({ repliedToId, text });
    setReplyText(undefined);
  };

  if (!text) {
    if (!repost) {
      return <>There was an error fetching the Repost.</>;
    }
    return (
      <div>
        <Link href={`/${repost.user.id}`}>
          {/* eslint-disable-next-line */}
          <img
            className="inline w-10 rounded-full"
            src={repost.user.image ?? ""}
            alt="profile picture"
          />
          <span className="mr-2">{repost.user.name}:</span>
        </Link>
        <span className="mr-10">
          <Link href={`/${repost.userId}/posts/${repost.id}`}>
            {repost.text}
          </Link>
        </span>
        <>
          <button className="mr-2" onClick={() => setReplyText("")}>
            Reply {repost.replies.length}
          </button>
          <button
            className="mr-2"
            onClick={() => deletePost.mutate({ postId: id })}
          >
            Undo Repost {repost.reposts.length}
          </button>
          {iHaveLiked(repost) ?
            <button
              className="mr-2"
              onClick={() => unlikePost.mutate({ postId: repost.id })}
            >
              Unlike {repost.likes.length}
            </button> :
            <button
              className="mr-2"
              onClick={() => likePost.mutate({ postId: repost.id })}
            >
              Like {repost.likes.length}
            </button>
          }
        </>
        {replyText !== undefined && (
          <div>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            ></textarea>
            <button
              className="mr-2"
              disabled={replyText.length === 0}
              onClick={() => onClickPostReply(repost.id, replyText)}
            >
              Post Reply
            </button>
            <button className="mr-2" onClick={() => setReplyText(undefined)}>
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <Link href={`/${user.id}`}>
        {/* eslint-disable-next-line */}
        <img
          className="inline w-10 rounded-full"
          src={user.image ?? ""}
          alt="profile picture"
        />
        <span className="mr-2">{user.name}:</span>
      </Link>
      <span className="mr-10">
        {editingText ? (
          <input
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
          />
        ) : (
          <Link href={`/${userId}/posts/${id}`}>{text}</Link>
        )}
      </span>
      {isMe(userId) && (
        <>
          {editingText ? (
            <button
              className="mr-2"
              disabled={editingText.length === 0}
              onClick={() => onConfirmEditingText(editingText)}
            >
              Confirm
            </button>
          ) : (
            <button className="mr-2" onClick={() => setEditingText(text)}>
              Edit
            </button>
          )}
          {deleting ? (
            <>
              <button
                className="mr-2"
                onClick={() => deletePost.mutate({ postId: id })}
              >
                Confirm
              </button>
              <button className="mr-2" onClick={() => setDeleting(false)}>
                Cancel
              </button>
            </>
          ) : (
            <button className="mr-2" onClick={() => setDeleting(true)}>
              Delete
            </button>
          )}
        </>
      )}
      <>
        <button className="mr-2" onClick={() => setReplyText("")}>
          Reply {replies.length}
        </button>
        <button
          className="mr-2"
          onClick={() => repostPost.mutate({ repostId: id })}
        >
          Repost {reposts.length}
        </button>
        {iHaveLiked({ likes }) ?
          <button
            className="mr-2"
            onClick={() => unlikePost.mutate({ postId: id })}
          >
            Unlike {likes.length}
          </button> :
          <button
            className="mr-2"
            onClick={() => likePost.mutate({ postId: id })}
          >
            Like {likes.length}
          </button>
        }
      </>
      {replyText !== undefined && (
        <div>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          ></textarea>
          <button
            className="mr-2"
            disabled={replyText.length === 0}
            onClick={() => onClickPostReply(id, replyText)}
          >
            Post Reply
          </button>
          <button className="mr-2" onClick={() => setReplyText(undefined)}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
