// filepath: /jest.config.mjs
export default {
  transform: {
    "^.+\\.js$": "babel-jest",
  },
  testEnvironment: "node",
  moduleFileExtensions: ["js"],
  testMatch: ["**/tests/**/*.test.js"],
  transformIgnorePatterns: [
    "/node_modules/(?!(node-fetch)/)",
    "/node_modules/(?!data-uri-to-buffer)",
  ],
};