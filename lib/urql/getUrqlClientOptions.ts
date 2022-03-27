import { devtoolsExchange } from '@urql/devtools';
import { cacheExchange, Data } from '@urql/exchange-graphcache';
import { IntrospectionData } from '@urql/exchange-graphcache/dist/types/ast';
import { authExchange } from '@urql/exchange-auth';
import { NextUrqlClientConfig } from 'next-urql';
import {
  debugExchange,
  dedupExchange,
  fetchExchange,
  makeOperation,
} from 'urql';
import getIsClient from 'lib/utils/getIsClient';
import getIsProduction from 'lib/utils/getClientIsProduction';
import {
  CONTENTFUL_ACCESS_TOKEN,
  CONTENTFUL_GRAPHQL_ENDPOINT,
  CONTENTFUL_PREVIEW_TOKEN,
} from 'lib/contentful/graphqlConfig';
import schema from 'graphql/schema/schema.json';
import fillObjectWithCustomKeySameValue from 'lib/utils/fillObjectWithCustomKeySameValue';

const getEntryCustomKey = (
  data: Data & { sys?: { id?: string }; name?: string }
) => data.sys?.id;

const getUrqlClientOptions =
  (preview = false): NextUrqlClientConfig =>
  (ssrCache) => {
    const isClient = getIsClient();
    const isProd = getIsProduction();
    return {
      url: CONTENTFUL_GRAPHQL_ENDPOINT,
      // can change the request policy later through requestPolicyExchange
      // https://formidable.com/open-source/urql/docs/api/request-policy-exchange/
      requestPolicy: 'cache-first',
      exchanges: [
        ...(isClient && !isProd ? [devtoolsExchange, debugExchange] : []),
        dedupExchange,
        cacheExchange({
          // determine caching keys for normalized cache
          // https://formidable.com/open-source/urql/docs/graphcache/normalized-caching/#custom-keys-and-non-keyable-entities
          keys: {
            ...fillObjectWithCustomKeySameValue(
              ['ContentfulMetadata', 'Sys'],
              () => null
            ),
            ...fillObjectWithCustomKeySameValue(
              [
                'PageCollection',
                'Page',
                'Seo',
                'PageContentCollection',
                'PageContent',
                'PageContentContentCollection',
              ],
              getEntryCustomKey
            ),
          },
          // schema awareness https://formidable.com/open-source/urql/docs/graphcache/schema-awareness/
          schema: schema as IntrospectionData,
        }),
        // authentication https://formidable.com/open-source/urql/docs/advanced/authentication/
        authExchange<{ token: string }>({
          getAuth: async ({ authState }) => {
            if (!authState) {
              const token = preview
                ? CONTENTFUL_PREVIEW_TOKEN
                : CONTENTFUL_ACCESS_TOKEN;
              if (token) {
                return { token };
              }
              return null;
            }

            return null;
          },
          addAuthToOperation: ({ authState, operation }) => {
            if (!authState || !authState.token) {
              return operation;
            }

            const fetchOptions =
              typeof operation.context.fetchOptions === 'function'
                ? operation.context.fetchOptions()
                : operation.context.fetchOptions || {};

            return makeOperation(operation.kind, operation, {
              ...operation.context,
              fetchOptions: {
                ...fetchOptions,
                headers: {
                  ...fetchOptions.headers,
                  Authorization: `Bearer ${authState.token}`,
                },
              },
            });
          },
          didAuthError: ({ error }) => {
            return (
              error.graphQLErrors.some((e) =>
                /ACCESS_TOKEN/i.test(
                  (
                    e.extensions as {
                      contentful: { code: string; requestId: string };
                    }
                  )?.contentful?.code ?? ''
                )
              ) || error.response.status === 401
            );
          },
        }),
        // ssrExchange to allow server side cache,
        // https://formidable.com/open-source/urql/docs/advanced/server-side-rendering/#nextjs
        ssrCache, // ssrExchange has to come before fetchExchange
        fetchExchange,
      ],
    };
  };

export default getUrqlClientOptions;
