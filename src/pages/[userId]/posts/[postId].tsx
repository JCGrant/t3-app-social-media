import { type User, type Post, type Attachment } from "@prisma/client";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import AutoResizeTextArea from "../../../components/AutoResizeTextArea";
import { api } from "../../../utils/api";
import { userSlug } from "../../../utils/models";

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

  const [replyText, setReplyText] = useState<string>("");

  const replyToPost = api.posts.replyTo.useMutation(onMutatePost);

  const onClickPostReply = (repliedToId: string, text: string) => {
    replyToPost.mutate({ repliedToId, text });
    setReplyText("");
  };

  if (post.status === "loading") {
    return <div>loading</div>;
  }

  const postData = post.data;
  if (!postData) {
    return <div>@{postId} - no such post</div>;
  }

  return (
    <>
      <Head>
        <title>
          {postData.user.name} - {postData.text}
        </title>
      </Head>
      <div className="mx-auto lg:w-1/2">
        <PostCard post={postData} onUpdatePosts={onMutatePost} mainPost />
        <div className="mb-4 flex flex-col">
          {replyText.length > 0 && (
            <span>Replying to @{postData.user.name}</span>
          )}
          <AutoResizeTextArea
            placeholder="Post your reply"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="mb-2 h-fit w-full resize-none rounded-md bg-purple-900 p-2 placeholder-gray-200"
          />
          <button
            className="self-end rounded-md bg-purple-800 p-2 font-bold hover:opacity-90 disabled:opacity-70"
            disabled={replyText.length === 0}
            onClick={() => onClickPostReply(postData.id, replyText)}
          >
            Post Reply
          </button>
        </div>
        <h2 className="mb-2 text-xl">Replies</h2>
        {(postData.replies ?? []).map((p) => (
          <PostCard key={p.id} post={p} onUpdatePosts={onMutatePost} />
        ))}
      </div>
    </>
  );
};

export default PostPage;

export type PostProps = {
  post: Post & {
    user: User;
    likes: User[];
    attachments: Attachment[];
    reposts: Post[];
    replies: Post[];
    repost:
    | (Post & {
      user: User;
      likes: User[];
      attachments: Attachment[];
      reposts: Post[];
      replies: Post[];
    })
    | null;
  };
  mainPost?: boolean;
  onUpdatePosts: { onMutate: () => void };
};

export const PostCard: React.FC<PostProps> = (props) => {
  const { post, onUpdatePosts } = props;

  const session = useSession();

  const isMe = (userId: string) => session.data?.user?.id === userId;

  const [deleting, setDeleting] = useState(false);

  const deletePost = api.posts.delete.useMutation(onUpdatePosts);

  if (post.text === null) {
    if (post.repost === null) {
      return <>There was an error fetching the Repost.</>;
    }
    return (
      <div className="mb-2 rounded-md border-b-2 border-b-purple-900 bg-purple-800 p-4 pb-2">
        <div className="ml-16 text-sm">
          <span className="mr-4">
            <Link href={`/${userSlug(post.user)}`}>
              {post.user.name} Reposted
            </Link>
          </span>
          {isMe(post.user.id) &&
            (deleting ? (
              <>
                <button
                  className="mr-2 text-red-600"
                  onClick={() => deletePost.mutate({ postId: post.id })}
                >
                  Confirm
                </button>
                <button className="mr-2" onClick={() => setDeleting(false)}>
                  Cancel
                </button>
              </>
            ) : (
              <button className="mr-2" onClick={() => setDeleting(true)}>
                Delete Repost
              </button>
            ))}
        </div>
        <IndividualPost {...props} post={post.repost} />
      </div>
    );
  }
  return (
    <div className="mb-2 rounded-md border-b-2 border-b-purple-900 bg-purple-800 p-4 pb-2">
      <IndividualPost {...props} />
    </div>
  );
};

type IndividualPostProps = {
  post: Post & {
    user: User;
    likes: User[];
    attachments: Attachment[];
    reposts: Post[];
    replies: Post[];
  };
  mainPost?: boolean;
  onUpdatePosts: { onMutate: () => void };
};

const IndividualPost: React.FC<IndividualPostProps> = ({
  post,
  mainPost,
  onUpdatePosts,
}) => {
  const { id, userId, user, text, likes, attachments, reposts, replies } = post;
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

  return (
    <div className="flex">
      <div>
        <Link href={`/${userSlug(user)}`}>
          {/* eslint-disable-next-line */}
          <img
            className="mr-2 inline w-14 rounded-full border-2 border-purple-900"
            src={user.image ?? ""}
            alt="profile picture"
          />
        </Link>
      </div>
      <div className="flex-1">
        <Link href={`/${userSlug(user)}`}>
          <span className="mr-2 font-bold hover:underline">{user.name}</span>
          <span className="mr-2 text-purple-400">@{userSlug(user)}</span>
        </Link>
        <div className="mb-2">
          {editingText !== undefined ? (
            <>
              <span>Editing Post...</span>
              <AutoResizeTextArea
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                className="mb-2 h-fit w-full resize-none rounded-md bg-purple-900 p-2"
              />
            </>
          ) : mainPost ? (
            <span className="text-2xl">{text}</span>
          ) : (
            <Link href={`/${userSlug(user)}/posts/${id}`}>{text}</Link>
          )}
        </div>
        <div>
          {attachments.map((a) => (
            <div key={a.id}>
              {/* eslint-disable-next-line */}
              <img
                src={`https://t3-app-social-media-files.s3.eu-west-2.amazonaws.com/${a.hash}`}
              />
            </div>
          ))}
        </div>
        <div className="mb-2 font-bold">
          {isMe(userId) && (
            <>
              {editingText ? (
                <>
                  <button
                    className="mr-2"
                    disabled={editingText.length === 0}
                    onClick={() => onConfirmEditingText(editingText)}
                  >
                    Confirm
                  </button>
                  <button
                    className="mr-2"
                    onClick={() => setEditingText(undefined)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  className="mr-2"
                  onClick={() => setEditingText(text ?? "")}
                >
                  Edit
                </button>
              )}
              {deleting ? (
                <>
                  <button
                    className="mr-2 text-red-600"
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
            {iHaveLiked({ likes }) ? (
              <button
                className="mr-2"
                onClick={() => unlikePost.mutate({ postId: id })}
              >
                Unlike {likes.length}
              </button>
            ) : (
              <button
                className="mr-2"
                onClick={() => likePost.mutate({ postId: id })}
              >
                Like {likes.length}
              </button>
            )}
          </>
        </div>
        {replyText !== undefined && (
          <div>
            <span>Replying to @{user.name}</span>
            <AutoResizeTextArea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="mb-2 h-fit w-full resize-none rounded-md bg-purple-900 p-2"
            />
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
    </div>
  );
};
