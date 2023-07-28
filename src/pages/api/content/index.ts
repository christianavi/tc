import { NextApiRequest, NextApiResponse } from 'next';

import { prismaClient } from '@/lib/prisma.client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      const _content = await prismaClient.contentMeta.findMany({
        include: {
          _count: {
            select: {
              views: true,
              likes: true,
            },
          },
        },
      });

      const content = _content.map((meta) => {
        return {
          slug: meta.slug,
          views: meta._count.views,
          likes: meta._count.likes,
        };
      });

      // Sort alphabetically
      content.sort((a, b) => a.slug.localeCompare(b.slug));

      res.status(200).json(content);
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
