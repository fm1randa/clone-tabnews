import database from "infra/database";

async function status(request, response) {
  const updatedAt = new Date().toISOString();
  const databaseInfo = await database.getDatabaseInfo();

  response.status(200).json({
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: databaseInfo.version,
        max_connections: databaseInfo.maxConnections,
        opened_connections: databaseInfo.openedConnections
      }
    }
  });
}

export default status;
 