const React = require("react");

module.exports = {
  HelmetProvider: ({ children }) =>
    React.createElement(React.Fragment, null, children),
  Helmet: () => null,
};
