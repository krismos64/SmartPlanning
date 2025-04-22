import "styled-components";
import { Theme } from "../components/ThemeProvider";

declare module "styled-components" {
  export interface DefaultTheme extends Theme {}
}
