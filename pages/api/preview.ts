import type { NextApiRequest, NextApiResponse } from 'next';
import { CONTENTFUL_PREVIEW_TOKEN } from 'lib/contentful/graphqlConfig';

type Data = {
  [key: string]: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { slug = '', secret, ...params } = req.query;

  if (secret !== CONTENTFUL_PREVIEW_TOKEN) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  res.setPreviewData({});

  res.redirect(
    `/${slug}?${Object.entries(params)
      .map((entries) => entries.join('='))
      .join('&')}`
  );
}
