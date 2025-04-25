require("@testing-library/jest-dom");

// Corriger le problème "vendors.map is not a function" dans ci-info
jest.mock(
  "ci-info",
  () => ({
    isCI: false,
    name: null,
    SEMAPHORE: false,
    JENKINS: false,
    CIRCLE: false,
    GITLAB: false,
    TRAVIS: false,
    GITHUB_ACTIONS: false,
    BUILDKITE: false,
  }),
  { virtual: true }
);

// Mock pour HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = () => {
  return {
    fillRect: () => {},
    clearRect: () => {},
    getImageData: () => ({ data: [] }),
    putImageData: () => {},
    createImageData: () => [],
    setTransform: () => {},
    drawImage: () => {},
    save: () => {},
    fillText: () => {},
    restore: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    stroke: () => {},
    translate: () => {},
    scale: () => {},
    rotate: () => {},
    arc: () => {},
    fill: () => {},
    measureText: () => ({ width: 0 }),
    transform: () => {},
    rect: () => {},
    clip: () => {},
  };
};
