import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

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
          likes: {
            orderBy: {
              createdAt: "desc",
            },
            include: {
              user: true,
              likes: true,
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
                  likes: true,
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
          followers: true,
          following: true,
          posts: {
            orderBy: {
              createdAt: "desc",
            },
            include: {
              user: true,
              likes: true,
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
                  likes: true,
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

  follow: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
        include: {
          following: true,
        },
      });
      if (!user) {
        return;
      }
      if (ctx.session.user.id === input.userId) {
        return;
      }
      // If logged in user has already followed user, return
      if (user.following.some(({ id }) => id === input.userId)) {
        return;
      }
      return ctx.prisma.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: {
          following: {
            set: [
              { id: input.userId },
              ...user.following.map((u) => ({ id: u.id })),
            ],
          },
        },
      });
    }),

  unfollow: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
        include: {
          following: true,
        },
      });
      if (!user) {
        return;
      }
      // If logged in user has NOT already followed user, return
      if (!user.following.some(({ id }) => id === input.userId)) {
        return;
      }
      return ctx.prisma.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: {
          following: {
            set: user.following
              .filter((u) => u.id !== input.userId)
              .map((u) => ({ id: u.id })),
          },
        },
      });
    }),
});
