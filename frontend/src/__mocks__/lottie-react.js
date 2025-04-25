const React = require("react");

// Mock pour l'interface LottieComponentProps
const LottieComponentProps = {};

// Mock pour le composant Lottie
const Lottie = (props) => {
  return React.createElement(
    "div",
    {
      "data-testid": "lottie",
      className: props.className || "",
      style: props.style || {},
    },
    null
  );
};

// Exporter le mock comme export par défaut et le type comme named export
module.exports = Lottie;
module.exports.default = Lottie;
module.exports.LottieComponentProps = LottieComponentProps;
