/**
 * Mock de styled-components pour les tests Jest
 *
 * Ce fichier simule les fonctionnalités principales de styled-components
 * pour permettre aux tests de s'exécuter sans charger la bibliothèque réelle.
 */

const React = require("react");

// Crée un composant React simple qui préserve toutes les props
const createStyledComponent = (Component) => {
  // Cette fonction sera appelée avec un tagged template literal
  return function templateLiteral() {
    // Retourne un composant React
    return function StyledComponent(props) {
      const { children, ...otherProps } = props;
      return React.createElement(
        typeof Component === "string" ? Component : "div",
        otherProps,
        children
      );
    };
  };
};

// Un objet style avec des méthodes pour chaque élément HTML
const styled = {};

// Ajoute tous les éléments HTML comme méthodes de l'objet styled
const htmlElements = [
  "a",
  "abbr",
  "address",
  "area",
  "article",
  "aside",
  "audio",
  "b",
  "base",
  "bdi",
  "bdo",
  "big",
  "blockquote",
  "body",
  "br",
  "button",
  "canvas",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "data",
  "datalist",
  "dd",
  "del",
  "details",
  "dfn",
  "dialog",
  "div",
  "dl",
  "dt",
  "em",
  "embed",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hgroup",
  "hr",
  "html",
  "i",
  "iframe",
  "img",
  "input",
  "ins",
  "kbd",
  "keygen",
  "label",
  "legend",
  "li",
  "link",
  "main",
  "map",
  "mark",
  "menu",
  "menuitem",
  "meta",
  "meter",
  "nav",
  "noscript",
  "object",
  "ol",
  "optgroup",
  "option",
  "output",
  "p",
  "param",
  "picture",
  "pre",
  "progress",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "script",
  "section",
  "select",
  "small",
  "source",
  "span",
  "strong",
  "style",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "title",
  "tr",
  "track",
  "u",
  "ul",
  "var",
  "video",
  "wbr",
];

htmlElements.forEach((element) => {
  styled[element] = createStyledComponent(element);
});

// Fonction principale qui accepte un composant React et retourne un StyledComponent
const styledFunction = (Component) => createStyledComponent(Component);

// On copie toutes les propriétés de l'objet styled dans la fonction styledFunction
Object.assign(styledFunction, styled);

styled.button = createStyledComponent("button");

// ThemeProvider simplement passe children
const ThemeProvider = ({ theme, children }) =>
  React.createElement(
    "div",
    { "data-theme": theme ? "true" : "false" },
    children
  );

// createGlobalStyle retourne un composant qui ne rend rien
const createGlobalStyle = () => () => null;

// css retourne une chaîne vide (pour simuler les styles)
const css = () => "";

// keyframes retourne un identifiant d'animation
const keyframes = () => "animation-key";

// Fonction helper attrs
styledFunction.attrs = () => styledFunction;

// Exporter en format CommonJS
module.exports = styledFunction;
module.exports.div = createStyledComponent("div");
module.exports.default = styledFunction;
module.exports.ThemeProvider = ThemeProvider;
module.exports.createGlobalStyle = createGlobalStyle;
module.exports.css = css;
module.exports.keyframes = keyframes;

// Fonctionnalités supplémentaires
module.exports.ServerStyleSheet = class ServerStyleSheet {
  collectStyles(children) {
    return children;
  }
  getStyleElement() {
    return null;
  }
  seal() {}
  constructor() {
    this.instance = this;
  }
  get instance() {
    return this;
  }
};

module.exports.StyleSheetManager = ({ children }) => children;
