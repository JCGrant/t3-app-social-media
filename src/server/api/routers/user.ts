import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  get: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(({ ctx, input }) => {
      return ctx.prisma.user.findFirst({
        where: {
          id: input.id,
        },
        include: {
          followers: true,
          following: true,
          posts: {
            orderBy: {
              createdAt: "desc",
            },
            include: {
              user: true,
              replies: {
                orderBy: {
                  createdAt: "desc",
                },
              },
              reposts: {
                orderBy: {
                  createdAt: "desc",
                },
              },
              repost: {
                include: {
                  user: true,
                  replies: {
                    orderBy: {
                      createdAt: "desc",
                    },
                  },
                  reposts: {
                    orderBy: {
                      createdAt: "desc",
                    },
                  },
                },
              },
            },
          },
        },
      });
    }),
});
