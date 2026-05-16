// src/App.jsx
import { Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import "./milaniStyles.css";
import { Layout } from "./Layout";
import { WpPage } from "./WpPage";

// Solo lazy para rutas secundarias — WpPage siempre se necesita
const SearchResults    = lazy(() => import("./SearchResults").then(m => ({ default: m.SearchResults })));
const CategoryTemplate = lazy(() => import("./pages/CategoryTemplate"));

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<WpPage fixedSlug="home" />} />

        <Route path="search" element={
          <Suspense fallback={null}><SearchResults /></Suspense>
        } />
        <Route path=":city/search" element={
          <Suspense fallback={null}><SearchResults /></Suspense>
        } />

        <Route path=":city/category/:slug" element={
          <Suspense fallback={null}><CategoryTemplate /></Suspense>
        } />
        <Route path="category/:slug" element={
          <Suspense fallback={null}><CategoryTemplate /></Suspense>
        } />

        <Route path=":city/*" element={<WpPage />} />
        <Route path="*" element={<WpPage />} />
      </Route>
    </Routes>
  );
}

export default App;
