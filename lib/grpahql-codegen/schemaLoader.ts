import fetch from 'cross-fetch';
import {
  getIntrospectionQuery,
  buildClientSchema,
  IntrospectionQuery,
} from 'graphql';
import { minifyIntrospectionQuery } from '@urql/introspection';
// load env files first
import 'lib/utils/serverLoadEnvConfig';
import {
  CONTENTFUL_ACCESS_TOKEN,
  CONTENTFUL_GRAPHQL_ENDPOINT,
} from 'lib/contentful/graphqlConfig';
import writeFileAndCreateDirectoryIfNotExists from 'lib/utils/writeFileAndCreateDirectoryIfNotExists';

const schemaLoader = async () => {
  const introspectionQuery = getIntrospectionQuery({ descriptions: false });

  const response = await fetch(CONTENTFUL_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CONTENTFUL_ACCESS_TOKEN}`,
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
