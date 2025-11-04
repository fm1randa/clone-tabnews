import { loadEnvConfig } from "@next/env";

export default async function setupTests() {
  const projectDir = process.cwd();
  loadEnvConfig(projectDir);
}
