const React = require("react");

const TimePicker = ({ value, onChange, className }) => {
  return React.createElement(
    "div",
    {
      className: `react-time-picker-wrapper ${className || ""}`,
      "data-testid": "time-picker",
    },
    [
      React.createElement("input", {
        key: "input",
        type: "text",
        value: value || "",
        onChange: (e) => onChange && onChange(e.target.value),
        "data-testid": "time-picker-input",
        className: "react-time-picker-input",
      }),
    ]
  );
};

module.exports = TimePicker;
module.exports.default = TimePicker;
