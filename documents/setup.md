# Setup

## [Node](https://github.com/nvm-sh/nvm)

1. [install nvm](https://github.com/nvm-sh/nvm#installing-and-updating) if not done yet
1. use latest node version
    ```sh
    nvm use node || nvm install node
    ```

## [NextJs](https://nextjs.org)

1. create nextjs app in the parent folder

    ```sh
    npx create-next-app@latest --typescript <project-name>
    # or
    pnpm create next-app -- --typescript <project-name>
    ```

## [PNPM](https://pnpm.io/)

1. pin nodejs version in the project

    ```sh
    node -v > .nvmrc
    ```

1. remove the `package.json` and `node_modules/`

    ```sh
    rm package.json
    rm -rf node_modules
    ```

1. install pnpm globally

    ```sh
    npm i -g pnpm
    ```

1. install dependencies

    ```sh
    pnpm install
    ```

## [Eslint and Prettier](https://dev.to/robertcoopercode/using-eslint-and-prettier-in-a-typescript-project-53jb)

1. remove `.eslintrc.json`

    ```sh
    rm .eslintrc.json
    ```

1. install prettier

    ```sh
    pnpm i -D prettier eslint-config-prettier eslint-plugin-prettier
    ```

1. add `.eslintrc.js`

    ```js
    module.exports = {
        extends: ['next', 'prettier', 'plugin:prettier/recommended'],
    };
    ```

1. add `.prettier.js`

    ```js
    /** @type {import('prettier').Config} */
    module.exports = {
        tabWidth: 2,
        overrides: [
            {
                files: '*.md',
                options: {
                    tabWidth: 4,
                },
            },
        ],
        semi: true,
        singleQuote: true,
        printWidth: 80,
        trailingComma: 'es5',
    };
    ```

## [Jest](https://nextjs.org/docs/testing#setting-up-jest-with-the-rust-compiler)

1. install jest and react-testing-library
    ```sh
    pnpm i -D jest @testing-library/react @testing-library/jest-dom
    ```
1. add `__tests__/` folder
    ```sh
    mkdir -p __tests__
    ```
1. add `__tests__/jest.config.js`

    ```js
    const nextJest = require('next/jest');

    const createJestConfig = nextJest({
        dir: './',
    });

    const customJestConfig = {
        rootDir: '../',
        setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
        moduleDirectories: ['node_modules', '<rootDir>/'],
        testRegex: '__tests__/.*\\.test\\.tsx?$',
        testEnvironment: 'jest-environment-jsdom',
    };

    module.exports = createJestConfig(customJestConfig);
    ```

1. add `__tests__/jest.setup.ts`
    ```ts
    import '@testing-library/jest-dom/extend-expect';
    ```
1. add to `package.json`
    ```json
    {
        "scripts": {
            "test": "jest --config ./__tests__/jest.config.js",
            "test:watch": "jest --config ./__tests__/jest.config.js --watch"
        }
    }
    ```

## [URQL](https://www.npmjs.com/package/next-urql)

1. install urql and nextjs bindings

    ```sh
    pnpm i urql graphql next-urql react-is @urql/core @urql/exchange-graphcache
    pnpm i -D @urql/devtools
    ```

1. add `lib/urql/getUrqlClientOptions.ts`

    ```ts
    import { devtoolsExchange } from '@urql/devtools';
    import { cacheExchange } from '@urql/exchange-graphcache';
    import { NextUrqlClientConfig } from 'next-urql';
    import { debugExchange, dedupExchange, fetchExchange } from 'urql';
    import getIsClient from 'lib/utils/getIsClient';

    const getUrqlClientOptions: NextUrqlClientConfig = (ssrCache) => {
        const isClient = typeof window !== 'undefined';
        const isProd = process.env.NEXT_PUBLIC_ENV === 'production';
        return {
            url: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || '',
            exchanges: [
                ...(isClient && !isProd
                    ? [devtoolsExchange, debugExchange]
                    : []),
                dedupExchange,
                cacheExchange({}),
                ssrCache, // ssrExchange has to come before fetchExchange
                fetchExchange,
            ],
        };
    };

    export default getUrqlClientOptions;
    ```

1. add graphql query, i.e. `graphql/query/userQuery.ts`

    ```ts
    export const USER_QUERY = `
        query {
            post(id: 1) {
                id
                title
                body
            }
        }
    `;
    ```

1. instantiate graphql client in one of the `getStaticProps` or `getServerSideProps` methods

    ```ts
    import type { GetStaticProps } from 'next';
    import getUrqlClientOptions from 'lib/urql/getUrqlClientOptions';
    import { initUrqlClient } from 'next-urql';
    import { USER_QUERY } from 'graphql/query/userQuery';
    import { ssrExchange } from 'urql';
    import { WithUrqlState } from 'next-urql';

    export interface PageProps {}

    export interface StaticProps extends WithUrqlState, PageProps {}

    export const getStaticProps: GetStaticProps<StaticProps> = async () => {
        const ssrCache = ssrExchange({ isClient: false });
        const urqlClientOption = getUrqlClientOptions(ssrCache);
        const client = initUrqlClient(urqlClientOption, false);

        await client?.query(USER_QUERY).toPromise();

        return {
            props: {
                urqlState: ssrCache.extractData(),
            },
            revalidate: 600,
        };
    };
    ```

1. add `lib/urql/withStaticUrqlClient.ts` to wrap static generated pages

    ```ts
    import { withUrqlClient } from 'next-urql';
    import getUrqlClientOptions from './getUrqlClientOptions';

    const withStaticUrqlClient = withUrqlClient(getUrqlClientOptions, {
        neverSuspend: true, // don't use Suspense on server side
        ssr: false, // don't generate getInitialProps for the page
        staleWhileRevalidate: true, // tell client to do network-only data fetching again if the cached data is outdated
    });

    export default withStaticUrqlClient;
    ```

1. wrap the page with `withStaticUrqlClient`

    ```ts
    import withStaticUrqlClient from 'lib/urql/withStaticUrqlClient';

    // ...

    export default withStaticUrqlClient(Page);
    ```

## [GraqphQL Codegen](https://www.graphql-code-generator.com/docs/guides/react#optimal-configuration-for-apollo-and-urql)

1. install graphql codegen dependencies

    ```ts
    pnpm i @graphql-typed-document-node/core
    pnpm i -D @graphql-codegen/cli @graphql-codegen/typed-document-node @graphql-codegen/typescript @graphql-codegen/typescript-operations
    ```

1. add `lib/graphql-codegen/codegen.yml`

    ```yml
    schema: <html-to-graphql-endpoint-or-path-to-server-graphql>
    documents: './graphql/**/*.graphql' # custom frontend query or mutation defined in graphql
    generates:
        ./graphql/generated.ts:
            plugins:
                - typescript
                - typescript-operations
                - typed-document-node
            config:
                fetcher: fetch
    ```

1. add to `package.json`
    ```json
    {
        "scripts": {
            "codegen": "graphql-codegen --config lib/grpahql-codegen/codegen.yml"
        }
    }
    ```

### [Custom Schema Loader](https://www.graphql-code-generator.com/docs/config-reference/schema-field#custom-schema-loader)

-   we use SWC to compile the custom schema loader ts files.

1. install additional dependencies

    ```sh
    pnpm i @next/env cross-fetch
    pnpm i -D @swc/core @swc/register @urql/introspection
    ```

1. add SWC config by adding `.swcrc`

    ```json
    {
        "sourceMaps": false,
        "module": {
            "type": "commonjs",
            "strict": false,
            "noInterop": false
        },
        "jsc": {
            "target": "es2020",
            "parser": {
                "syntax": "typescript",
                "decorators": true,
                "dynamicImport": true
            },
            "transform": {
                "legacyDecorator": true,
                "decoratorMetadata": true
            },
            "keepClassNames": true,
            "baseUrl": "./",
            "paths": {
                "^lib/*": ["./lib/*"]
            }
        }
    }
    ```

1. add util file `lib/utils/serverLoadEnvConfig.ts` to load env files like nextjs does

    ```ts
    import getServerIsProduction from '../utils/getServerIsProduction';
    import { loadEnvConfig } from '@next/env';

    const dev = !getServerIsProduction();
    loadEnvConfig(process.cwd(), dev);
    ```

1. add custom schema loader `lib/grpahql-codegen/schemaLoader.ts`

    ```ts
    import fetch from 'cross-fetch';
    import {
        getIntrospectionQuery,
        buildClientSchema,
        IntrospectionQuery,
    } from 'graphql';
    import { minifyIntrospectionQuery } from '@urql/introspection';
    // load env files first
    import 'lib/utils/serverLoadEnvConfig';
    import writeFileAndCreateDirectoryIfNotExists from 'lib/utils/writeFileAndCreateDirectoryIfNotExists';

    const schemaLoader = async () => {
        const introspectionQuery = getIntrospectionQuery({
            descriptions: false,
        });

        const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_ACCESS_TOKEN}`,
            },
            body: JSON.stringify({ query: introspectionQuery }),
        });

        const data: { data: IntrospectionQuery } = await response.json();

        // not using @graphql-codegen/urql-introspection as in https://www.graphql-code-generator.com/plugins/urql-introspection
        // because the generated file is always bigger than generated from manual configuration below
        const minifiedSchema = minifyIntrospectionQuery(data.data, {
            includeEnums: true,
        });

        writeFileAndCreateDirectoryIfNotExists(
            [process.cwd(), 'graphql/schema/schema.json'],
            JSON.stringify(minifiedSchema)
        );

        return buildClientSchema(data.data);
    };

    export default schemaLoader;
    ```

1. change `lib/graphql-codegen/codegen.yml`
    ```yml
    schema:
        - schemaLoader:
              loader: './lib/grpahql-codegen/schemaLoader.ts'
    documents: './graphql/**/*.graphql'
    generates:
        ./graphql/generated.ts:
            plugins:
                - typescript
                - typescript-operations
                - typed-document-node
            config:
                fetcher: fetch
    require:
        - '@swc/register'
    ```

## [Contentful](contentful.com)

1. install npm dependencies

    ```sh
    pnpm i @urql/exchange-auth
    ```

1. [Create a Contentful space](<(https://www.contentful.com/help/contentful-101/#step-2-create-a-space)>) and environment on Contentful if not created

1. set correct contentful endpoint and access token in a config file `lib/contentful/graphqlConfig.ts`

    ```ts
    export const CONTENTFUL_GRAPHQL_ENDPOINT = `${process.env.NEXT_PUBLIC_CONTENTFUL_GRAPHQL_BASE_URL}/spaces/${process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID}/environments/${process.env.NEXT_PUBLIC_CONTENTFUL_ENVIRONMENT}`;

    export const CONTENTFUL_ACCESS_TOKEN =
        process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN;
    ```

1. set the correct env vars from Contentful Space in [appropriate env files](https://nextjs.org/docs/basic-features/environment-variables)

    - `.env`

        ```
        NEXT_PUBLIC_CONTENTFUL_GRAPHQL_BASE_URL=https://graphql.contentful.com/content/v1
        NEXT_PUBLIC_CONTENTFUL_SPACE_ID=<space_id>
        NEXT_PUBLIC_CONTENTFUL_ENVIRONMENT=<environment_name>
        ```

    - `.env.local` (it still expose the token to the browser for client side graphql query. If client side query is not needed, remove `NEXT_PUBLIC_` in the env var.)
        ```
        NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN=<access_token>
        ```

1. change the corresponding urql and code gen related files to use the updated graphql endpoint and access token

1. add authentication to the graphql client options `lib/urql/getUrqlClientOptions.ts`

    ```ts
    // ...
    import { authExchange } from '@urql/exchange-auth';
    import {
        CONTENTFUL_ACCESS_TOKEN,
        CONTENTFUL_GRAPHQL_ENDPOINT,
    } from 'lib/contentful/graphqlConfig';
    // ...

    const getUrqlClientOptions: NextUrqlClientConfig = (ssrCache) => {
        // ...
        return {
            // ...
            exchanges: [
                // ...
                cacheExchange({}),
                authExchange<{ token: string }>({
                    getAuth: async ({ authState }) => {
                        if (!authState) {
                            const token = CONTENTFUL_ACCESS_TOKEN;
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
                // ...
            ]
        };

    // ...
    ```

### [Preview Mode](https://www.contentful.com/developers/docs/references/graphql/#/introduction/previewing-content)

1. add preview token in the config file `lib/contentful/graphqlCodegen.ts`

    ```ts
    // ...
    export const CONTENTFUL_PREVIEW_TOKEN =
        process.env.NEXT_PUBLIC_CONTENTFUL_PREVIEW_TOKEN;
    ```

1. set correct preview token env var from Contentful Space in `.env.local`

    ```
    NEXT_PUBLIC_CONTENTFUL_PREVIEW_TOKEN=<preview_token>
    ```

1. modify `lib/urql/getUrqlClientOptions.ts` to change authentication using preview token when in preview mode

    ```ts
    // ...
    import {
        CONTENTFUL_ACCESS_TOKEN,
        CONTENTFUL_GRAPHQL_ENDPOINT,
        CONTENTFUL_PREVIEW_TOKEN,
    } from 'lib/contentful/graphqlConfig';

    // ...
    const getUrqlClientOptions =
        (preview = false): NextUrqlClientConfig =>
        (ssrCache) => {
            // ...
            return {
                // ...
                exchanges: [
                    // ...
                    authExchange<{ token: string }>({
                        getAuth: async ({ authState }) => {
                            const token = preview
                                ? CONTENTFUL_PREVIEW_TOKEN
                                : CONTENTFUL_ACCESS_TOKEN;
                            // ...
                        },
                        // ...
                    }),
                    // ...
                ],
                // ...
            };
            // ...
        };
    // ...
    ```

1. modify `lib/urql/withStaticUrqlClient.ts` to incorporate preview mode

    ```ts
    // ...
    const withStaticUrqlClient = (preview = false) =>
        withUrqlClient(getUrqlClientOptions(preview), {
            neverSuspend: true, // don't use Suspense on server side
            ssr: false, // don't generate getInitialProps for the page
            staleWhileRevalidate: true, // tell client to do network-only data fetching again if the cached data is outdated
        });
    //...
    ```

1. modify `getStaticProps` in a page in `pages/` folder to incorporate preview mode

    ```ts
    import type { GetStaticProps } from 'next';
    import getUrqlClientOptions from 'lib/urql/getUrqlClientOptions';
    import {
        GetPageCollectionDocument, // example code generated graphql document node
        GetPageCollectionQuery, // example code generated graphql query type
        GetPageCollectionQueryVariables, // example code generated graphql query variables type
    } from 'graphql/generated';
    import { initUrqlClient } from 'next-urql';
    import { ssrExchange } from 'urql';
    import { WithUrqlClient, WithUrqlState } from 'next-urql';

    export interface PageProps {
        preview: boolean;
    }

    export interface StaticProps
        extends WithUrqlClient,
            WithUrqlState,
            PageProps {}

    export const getStaticProps: GetStaticProps<StaticProps> = async ({
        preview: contextPreview,
    }) => {
        const preview = !!contextPreview;
        const ssrCache = ssrExchange({ isClient: false });
        const urqlClientOption = getUrqlClientOptions(preview)(ssrCache);
        const client = initUrqlClient(urqlClientOption, false);

        await client
            ?.query<GetPageCollectionQuery, GetPageCollectionQueryVariables>(
                GetPageCollectionDocument,
                { preview }
            )
            .toPromise();

        return {
            props: {
                urqlState: ssrCache.extractData(),
                preview,
            },
            revalidate: 600,
        };
    };
    ```

1. modify `Page` in a page in `pages/` folder to incorporate preview mode with `withStaticUrqlClient`

    ```ts
    // ...
    import Head from 'next/head';
    import withStaticUrqlClient from 'lib/urql/withStaticUrqlClient';
    import { useQuery } from 'urql';
    import { FC, useMemo } from 'react';

    // ...
    export interface SubPageProps extends WithUrqlClient {
        pageProps: PageProps;
        resetUrqlClient?: () => void;
    }

    const SubPage: FC<SubPageProps> = ({ pageProps }) => {
        const { preview } = pageProps;
        const [result] = useQuery<
            GetPageCollectionQuery,
            GetPageCollectionQueryVariables
        >({
            query: GetPageCollectionDocument,
            variables: {
                preview,
            },
        });

        // add page content here
        return <div>{result?.data?.pageCollection?.total}</div>;
    };

    const Page: NextPage<StaticProps> = ({
        urqlState,
        urqlClient,
        ...restProps
    }) => {
        const { preview } = restProps;

        const WrappedComponent = useMemo(
            () => withStaticUrqlClient(preview)(SubPage),
            [preview]
        );

        return (
            <main>
                <Head>
                    {
                        // any tags that need to be inserted into <head></head>
                    }
                </Head>
                <WrappedComponent
                    pageProps={restProps}
                    urqlState={urqlState}
                    urqlClient={urqlClient}
                />
            </main>
        );
    };

    export default Page;
    ```

1. add api route to set preview mode cookie `pages/api/preview.ts`

    ```ts
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
    ```

1. add api route to clear preview mode cookie `pages/api/exit-preview.ts`

    ```ts
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
    ```
