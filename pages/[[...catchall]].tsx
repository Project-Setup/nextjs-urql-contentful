import {
  GetPageCollectionDocument,
  GetPageCollectionQuery,
  GetPageCollectionQueryVariables,
  GetPageSlugsDocument,
  GetPageSlugsQuery,
  GetPageSlugsQueryVariables,
  Maybe,
} from 'graphql/generated';
import {
  GetStaticPaths,
  GetStaticPathsResult,
  GetStaticProps,
  NextPage,
} from 'next';
import { ParsedUrlQuery } from 'querystring';
import initServerUrqlClient from 'lib/urql/initServerUrqlClient';
import withStaticUrqlClient from 'lib/urql/withStaticUrqlClient';
import ManifestHead from 'components/head/ManifestHead';
import Error from 'next/error';
import { useQuery } from 'urql';
import { WithUrqlClient, WithUrqlState } from 'next-urql';
import { FC, useMemo } from 'react';

export interface CatchallParsedUrlQuery extends ParsedUrlQuery {
  catchall: string | string[];
}

export interface PageProps {
  page?: Maybe<
    NonNullable<GetPageCollectionQuery['pageCollection']>['items'][number]
  >;
  preview: boolean;
}

export interface StaticProps extends WithUrqlClient, WithUrqlState, PageProps {}

export interface SubPageProps extends WithUrqlClient {
  pageProps: PageProps;
  resetUrqlClient?: () => void;
}

export const getStaticPaths: GetStaticPaths<
  CatchallParsedUrlQuery
> = async () => {
  // Here we have no way to get `preview` parameter
  // So we default to non-preview mode
  // pages in Contentful needs to be published to show up
  const { client, ssrCache } = initServerUrqlClient();

  const result = await client
    ?.query<GetPageSlugsQuery, GetPageSlugsQueryVariables>(
      GetPageSlugsDocument,
      { preview: false }
    )
    .toPromise();

  const paths =
    result?.data?.pageCollection?.items.reduce<
      GetStaticPathsResult<CatchallParsedUrlQuery>['paths']
    >((paths, item) => {
      if (!item?.slug) {
        return paths;
      }
      return [
        ...paths,
        {
          params: {
            catchall: item.slug?.split('/'),
          },
        },
      ];
    }, []) ?? [];

  return {
    paths,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps<
  StaticProps,
  CatchallParsedUrlQuery
> = async ({ preview: contextPreview, params }) => {
  const preview = !!contextPreview;
  const { client, ssrCache } = initServerUrqlClient({ preview });

  const result = await client
    ?.query<GetPageCollectionQuery, GetPageCollectionQueryVariables>(
      GetPageCollectionDocument,
      { preview }
    )
    .toPromise();

  const { catchall } = params ?? {};
  const pageSlug =
    typeof catchall === 'string'
      ? catchall
      : Array.isArray(catchall)
      ? catchall.join('/')
      : 'index';

  const page = result?.data?.pageCollection?.items.find(
    (page) => page?.slug === pageSlug
  );
  return {
    props: {
      urqlState: ssrCache.extractData(),
      page,
      preview,
    },
  };
};

const Page: FC<SubPageProps> = ({ pageProps }) => {
  const { preview, page } = pageProps;
  const [result] = useQuery<
    GetPageCollectionQuery,
    GetPageCollectionQueryVariables
  >({
    query: GetPageCollectionDocument,
    variables: {
      preview,
    },
  });

  // add conditional statement here
  // to determine what page it is and render page differently accordingly
  return <div>{page?.slug === 'index' ? <div>index page</div> : null}</div>;
};

const CatchallPage: NextPage<StaticProps> = ({
  urqlState,
  urqlClient,
  ...restProps
}) => {
  const { page, preview } = restProps;

  const WrappedComponent = useMemo(
    () => withStaticUrqlClient(preview)(Page),
    [preview]
  );

  if (!page || !page.seo?.title) {
    return <Error statusCode={404} />;
  }

  const seo = page?.seo;
  return (
    <main>
      {seo && (
        <ManifestHead
          title={seo.title}
          description={seo.description}
          keywords={seo.keywords}
          noFollow={seo.noFollow}
          noIndex={seo.noIndex}
        />
      )}
      <WrappedComponent
        pageProps={restProps}
        urqlState={urqlState}
        urqlClient={urqlClient}
      />
    </main>
  );
};

export default CatchallPage;
