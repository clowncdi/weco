import React from "react";
import ReactDOM from "react-dom";
import App from "./components/App";
import { BrowserRouter } from "react-router-dom";
import "./reset.css";
import "./styles.css";
import "./media.css";
import { HelmetProvider } from "react-helmet-async";

const root = document.getElementById("root");

ReactDOM.render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter basename={process.env.PUBLIC_URL}>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
  root
);
