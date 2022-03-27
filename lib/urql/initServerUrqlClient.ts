import { initUrqlClient } from 'next-urql';
import { ssrExchange } from 'urql';
import getUrqlClientOptions from './getUrqlClientOptions';

const initServerUrqlClient = ({
  ssrCache = ssrExchange({ isClient: false }),
  preview = false,
} = {}) => {
  const urqlClientOptions = getUrqlClientOptions(preview)(ssrCache);
  const client = initUrqlClient(urqlClientOptions, false);
  return {
    client,
    ssrCache,
    options: urqlClientOptions,
  };
};

export default initServerUrqlClient;
