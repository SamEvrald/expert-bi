/// <reference types="react-scripts" />

declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
