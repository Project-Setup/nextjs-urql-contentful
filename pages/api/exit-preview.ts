import type { NextApiRequest, NextApiResponse } from 'next';

type Data = {};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { slug = '', ...params } = req.query;

  res.clearPreviewData();

  res.redirect(
    `/${slug}?${Object.entries(params)
      .map((entries) => entries.join('='))
      .join('&')}`
  );
}
