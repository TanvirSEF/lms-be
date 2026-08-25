import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Database => {
  // single postgres database (railway) for both local dev and production.
  // local uses the public proxy url (DATABASE_SSL=true), railway uses the internal url.
  return {
    connection: {
      client: 'postgres',
      connection: {
        connectionString: env('DATABASE_URL'),
        ssl: env.bool('DATABASE_SSL', false)
          ? { rejectUnauthorized: false }
          : false,
      },
    },
  } as Core.Config.Database;
};

export default config;
