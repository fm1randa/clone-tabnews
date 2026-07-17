import database from "infra/database.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

function getNumberOfMigrationFiles() {
  const fs = require("fs");
  const dir = "infra/migrations";

  const files = fs.readdirSync(dir);
  return files.length;
}

async function cleanDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

async function checkMigrationTableExistence() {
  const {
    rows: {
      0: { exists: isMigrationTableAvailable },
    },
  } = await database.query(
    "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pgmigrations');",
  );
  return isMigrationTableAvailable;
}

beforeEach(async () => {
  await cleanDatabase();
  const isMigrationTableAvailable = await checkMigrationTableExistence();
  if (isMigrationTableAvailable)
    throw Error(
      "Migration table shouldn't be available. Check the database clean up logic.",
    );
});

test("POST to /api/v1/migrations should return 201 if any migrations were executed", async () => {
  const response = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });
  expect(response.status).toBe(201);
});

test("POST to /api/v1/migrations should return 200 if none migration was executed", async () => {
  // Call a first time so we can ensure that it doesn't have any migration to run in the second call
  const response = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });
  expect(response.status).toBe(201);

  // Call a second time
  const response2 = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });
  expect(response2.status).toBe(200);
});

test("POST to /api/v1/migrations should return an array", async () => {
  const response = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });

  const responseBody = await response.json();

  expect(Array.isArray(responseBody)).toBe(true);
  expect(responseBody.length).toBeGreaterThan(0);
});

test("POST to /api/v1/migrations should execute migrations", async () => {
  const numberOfMigrationFiles = getNumberOfMigrationFiles();

  await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });

  const isMigrationTableAvailable = await checkMigrationTableExistence();
  expect(isMigrationTableAvailable).toBeTruthy();

  const { rows: migrations } = await database.query(
    "SELECT * FROM pgmigrations",
  );

  /** We expect the number of executed migrations to equal the number of migration files because we're always
   *  cleaning the database before each test. */
  expect(migrations.length).toEqual(numberOfMigrationFiles);

  for (const migration of migrations) {
    expect(migration).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        name: expect.any(String),
        run_on: expect.any(Date),
      }),
    );
  }
});

test("POST to /api/v1/migrations should NOT execute migrations more than once", async () => {
  const numberOfMigrationFiles = getNumberOfMigrationFiles();

  const firstPostResponse = await fetch(
    "http://localhost:3000/api/v1/migrations",
    {
      method: "POST",
    },
  );

  const firstPostData = await firstPostResponse.json();
  expect(firstPostData.length).toBeGreaterThan(0);

  const isMigrationTableAvailable = await checkMigrationTableExistence();
  expect(isMigrationTableAvailable).toBeTruthy();

  const { rows: migrationsFromFirstQuery } = await database.query(
    "SELECT * FROM pgmigrations",
  );

  /** We expect the number of executed migrations to equal the number of migration files because we're always
   *  cleaning the database before each test. */
  expect(migrationsFromFirstQuery.length).toEqual(numberOfMigrationFiles);

  for (const migration of migrationsFromFirstQuery) {
    expect(migration).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        name: expect.any(String),
        run_on: expect.any(Date),
      }),
    );
  }

  // Execute a POST request again
  const secondPostResponse = await fetch(
    "http://localhost:3000/api/v1/migrations",
    {
      method: "POST",
    },
  );

  const secondPostData = await secondPostResponse.json();
  expect(secondPostData.length).toEqual(0);

  const { rows: migrationsFromSecondQuery } = await database.query(
    "SELECT * FROM pgmigrations",
  );
  expect(migrationsFromSecondQuery.length).toEqual(
    migrationsFromFirstQuery.length,
  );

  // Ensure that executed migrations didn't change between the first and second queries
  expect(
    migrationsFromSecondQuery.every((migrationFromSecondQuery) => {
      const equivalentMigrationFromFirstQuery = migrationsFromFirstQuery.find(
        (migrationFromFirstQuery) =>
          migrationFromFirstQuery.id === migrationFromSecondQuery.id,
      );
      return (
        equivalentMigrationFromFirstQuery.run_on.getTime() ===
        migrationFromSecondQuery.run_on.getTime()
      );
    }),
  ).toBeTruthy();
});
