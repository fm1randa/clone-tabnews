import { Client } from "pg";

async function query(queryObject) {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
  });
  await client.connect();
  try {
    return await client.query(queryObject);
  } catch (error) {
    console.error(error);
  } finally {
    await client.end();
  }
}

async function getDatabaseInfo() {
  const { rows: {0: databaseInfo} } = await query({
    text: `
      SELECT 
        (SELECT setting FROM pg_settings WHERE name = 'server_version') AS version,
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') AS max_connections,
        (SELECT COUNT(*)::int FROM pg_stat_activity WHERE datname = $1) AS opened_connections;
    `,
    values: [process.env.POSTGRES_DB]
  })
  return {
    version: databaseInfo.version,
    maxConnections: databaseInfo.max_connections,
    openedConnections: databaseInfo.opened_connections,
  }
}

export default {
  query: query,
  getDatabaseInfo: getDatabaseInfo
};
