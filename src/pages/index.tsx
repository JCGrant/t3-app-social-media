import { type NextPage } from "next";
import Head from "next/head";

import { api } from "../utils/api";
import { IndividualPost } from "./[userId]/posts/[postId]";

const Home: NextPage = () => {
  const timeline = api.posts.timeline.useQuery();

  const onMutateTimeline = {
    onMutate() {
      setTimeout(() => void timeline.refetch(), 300);
    },
  };

  if (timeline.status === 'loading') {
    return <>loading</>
  }

  if (!timeline.data) {
    return <>fetching timeline failed</>
  }

  return (
    <>
      <Head>
        <title>Timeline</title>
      </Head>
      <div>
        <h1 className="text-3xl">Timeline</h1>
        {timeline.data
          .filter((p) => p.repliedToId === null)
          .map(p =>
            <IndividualPost
              key={p.id}
              {...p}
              onUpdatePosts={onMutateTimeline}
            />)}
      </div>
    </>
  );
};

export default Home;

