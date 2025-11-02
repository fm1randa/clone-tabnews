const nextJest = require("next/jest");

module.exports = nextJest()({
  moduleDirectories: ["node_modules", "<rootDir>"],
  testTimeout: 60000,
  /** Filipe Deschamps choose a different approach, but I preferred following Next documentation: https://nextjs.org/docs/app/guides/environment-variables#test-environment-variables */
  globalSetup: './setupTests'
});