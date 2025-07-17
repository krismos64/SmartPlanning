/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^utils/getEnv$": "<rootDir>/src/utils/getEnv.jest.ts",
    "^../api/axiosInstance$": "<rootDir>/src/__mocks__/axiosInstance.js",
    "^../../api/axiosInstance$": "<rootDir>/src/__mocks__/axiosInstance.js",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(gif|ttf|eot|svg|png|jpg|jpeg|webp)$":
      "<rootDir>/src/__mocks__/fileMock.js",
    "\\.(json)$": "<rootDir>/src/__mocks__/jsonMock.js",
    "^lottie-react$": "<rootDir>/src/__mocks__/lottie-react.js",
    "framer-motion": "<rootDir>/node_modules/framer-motion",
    "^react-helmet-async$": "<rootDir>/src/__mocks__/react-helmet-async.js",
    "^styled-components$": "<rootDir>/src/__mocks__/styled-components.js",
    "^react-time-picker$": "<rootDir>/src/__mocks__/react-time-picker.js",
    "ci-info$": "<rootDir>/src/__mocks__/node_modules-ci-info-fix.js",
  },
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.spec.{ts,tsx}",
    "!src/**/*.stories.{ts,tsx}",
    "!src/main.tsx",
    "!src/setupTests.ts",
    "!src/vite-env.d.ts",
    "!src/__mocks__/**",
    "!src/types/global.d.ts",
    "!src/types/json.d.ts",
    "!src/types/styled.d.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["html", "text", "json", "lcov"],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
