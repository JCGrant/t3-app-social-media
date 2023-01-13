import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";

export const postsRouter = createTRPCRouter({
  get: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(({ ctx, input }) => {
      return ctx.prisma.post.findFirst({
        where: {
          id: input.id,
        },
        include: {
          user: true,
          replies: {
            orderBy: {
              createdAt: "desc",
            },
            include: {
              user: true,
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
          reposts: true,
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
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        text: z.string(),
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.prisma.post.create({
        data: {
          userId: ctx.session.user.id,
          text: input.text,
        },
      });
    }),

  replyTo: protectedProcedure
    .input(
      z.object({
        repliedToId: z.string(),
        text: z.string(),
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.prisma.post.create({
        data: {
          userId: ctx.session.user.id,
          text: input.text,
          repliedToId: input.repliedToId,
        },
      });
    }),

  repost: protectedProcedure
    .input(
      z.object({
        repostId: z.string(),
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.prisma.post.create({
        data: {
          userId: ctx.session.user.id,
          repostId: input.repostId,
        },
      });
    }),

  edit: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        text: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findFirst({
        where: {
          id: input.postId,
          userId: ctx.session.user.id,
        },
      });
      if (!post) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Can not edit another User's Post",
        });
      }
      return ctx.prisma.post.update({
        where: {
          id: input.postId,
        },
        data: {
          text: input.text,
        },
      });
    }),

  delete: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findFirst({
        where: {
          id: input.postId,
          userId: ctx.session.user.id,
        },
      });
      if (!post) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Can not delete another User's Post",
        });
      }
      return ctx.prisma.post.delete({
        where: {
          id: input.postId,
        },
      });
    }),

  like: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.prisma.post.update({
        where: {
          id: input.postId,
        },
        data: {
          likes: {
            increment: 1,
          },
        },
      });
    }),
});
