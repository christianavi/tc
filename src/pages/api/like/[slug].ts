import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getUserLikeCount } from '@/lib/api.server';
import { getSessionId } from '@/lib/helper.server';
import { prismaClient } from '@/lib/prisma.client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const slug = z.string().parse(req.query.slug);
  const sessionId = getSessionId(req);

  try {
    if (req.method === 'POST') {
      const likeCount = await getUserLikeCount({ sessionId, slug });

      if (likeCount >= 5) throw new Error('Max like count is 5');

      const content = await prismaClient.contentMeta.upsert({
        where: {
          slug: slug,
        },
        create: {
          slug,
          likes: {
            create: {
              sessionId,
            },
          },
        },
        update: {
          likes: {
            create: {
              sessionId,
            },
          },
        },
        include: {
          _count: {
            select: {
              views: true,
              likes: true,
            },
          },
        },
      });

      return res.status(201).json({
        contentViews: content._count.views,
        contentLikes: content._count.likes,
        likesByUser: likeCount + 1,
      });
    } else {
      res.status(405).json({ message: 'Method Not Allowed' });
    }
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error(err);
    if (err instanceof Error) {
      res.status(500).json({ message: err.message ?? 'Internal Server Error' });
    } else {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}
