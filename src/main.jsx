// src/main.jsx

import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { HelmetProvider } from "react-helmet-async";
import { register } from "swiper/element/bundle";

register();

const IS_DEV = import.meta.env.DEV;

function stripTrailingSlash(value = "") {
  return String(value || "").trim().replace(/\/+$/, "");
}

const wpBaseUrl = stripTrailingSlash(import.meta.env.VITE_WP_BASE_URL || "");
const graphqlUrl = stripTrailingSlash(
  import.meta.env.VITE_WORDPRESS_GRAPHQL_URL || ""
);

// ✅ Persistir env útil en window para hooks legacy/runtime
window.__MILANI_ENV__ = {
  wpBaseUrl,
  graphqlUrl,
};

if (IS_DEV) {
  console.log("ENV WP BASE", window.__MILANI_ENV__.wpBaseUrl);
  console.log("ENV GRAPHQL", window.__MILANI_ENV__.graphqlUrl);
}

if (!graphqlUrl) {
  throw new Error(
    "[Milani] Falta VITE_WORDPRESS_GRAPHQL_URL en las variables de entorno."
  );
}

const httpLink = new HttpLink({
  uri: graphqlUrl,
  useGETForQueries: true,
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          contentNode: {
            keyArgs: ["id", "idType"],
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-first",
      nextFetchPolicy: "cache-first",
      errorPolicy: "all",
    },
    query: {
      fetchPolicy: "cache-first",
      errorPolicy: "all",
    },
  },
});

const helmetContext = {};

createRoot(document.getElementById("root")).render(
  <HelmetProvider context={helmetContext}>
    <BrowserRouter>
      <ApolloProvider client={client}>
        <App />
      </ApolloProvider>
    </BrowserRouter>
  </HelmetProvider>
);