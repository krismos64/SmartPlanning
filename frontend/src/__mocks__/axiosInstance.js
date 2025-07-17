const mockAxiosInstance = {
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  interceptors: {
    request: {
      use: jest.fn(),
    },
    response: {
      use: jest.fn(),
    },
  },
  defaults: {
    baseURL: 'http://localhost:5050/api',
    withCredentials: true,
  },
};

const testAuthentication = jest.fn(() => Promise.resolve({ data: { success: true } }));

module.exports = mockAxiosInstance;
module.exports.default = mockAxiosInstance;
module.exports.testAuthentication = testAuthentication;