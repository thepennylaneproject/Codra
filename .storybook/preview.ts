import type { Preview } from "@storybook/react-vite";
import "../src/app/design-tokens.css";
import "../src/index.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "codra",
      values: [
        { name: "codra", value: "#FFFAF0" },
        { name: "dark", value: "#0A0E12" },
        { name: "white", value: "#FFFFFF" },
      ],
    },
  },
};

export default preview;
