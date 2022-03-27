import { loadEnvConfig } from '@next/env';
import getServerIsProduction from 'lib/utils/getServerIsProduction';

const dev = !getServerIsProduction();
loadEnvConfig(process.cwd(), dev);
