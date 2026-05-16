// src/SearchResults.jsx
import { useMemo } from "react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { Link, useSearchParams } from "react-router-dom";
import DOMPurify from "dompurify";

const PAGE_SIZE = 10;

const SEARCH_QUERY = gql`
  query Search($term: String!, $first: Int!, $after: String) {
    contentNodes(where: { search: $term }, first: $first, after: $after) {
      pageInfo {
        endCursor
        hasNextPage
      }
      nodes {
        __typename
        id
        uri

        ... on Page {
          title
          contentRendered
        }

        ... on Post {
          title
          date
          excerpt
          contentRendered
        }

        ... on Service {
          title
          contentRendered
        }

        ... on Career {
          title
          contentRendered
        }
      }
    }
  }
`;

/**
 * Convierte HTML a texto plano y lo recorta.
 */
/**
 * Convierte HTML a texto plano, decodifica entidades (&ntilde; -> ñ),
 * elimina shortcodes [foo], y lo recorta.
 */
function htmlToPreviewText(html, maxLen = 180) {
  if (!html) return "";

  // 1) Sanitizar a texto (sin tags)
  let text = DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

  // 2) Decodificar entidades HTML (&ntilde; -> ñ, &amp; -> &)
  //    (esto NO usa innerHTML sobre el DOM real; es un textarea aislado)
  if (typeof document !== "undefined") {
    const txt = document.createElement("textarea");
    txt.innerHTML = text;
    text = txt.value;
  }

  // 3) Eliminar shortcodes de WP:
  //    - simples: [phone-milani]
  //    - con attrs: [gallery id="1"]
  //    - closing: [foo]...[/foo]
  //    Nota: si quieres conservar contenido interno de [foo]...[/foo], se complica;
  //    aquí lo removemos completo para previews limpios.
  text = text
    .replace(/\[\/?[A-Za-z0-9_-]+(?:\s+[^\]]*)?\]/g, " ") // [tag], [/tag], [tag a="b"]
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return "";
  if (text.length <= maxLen) return text;

  return text.slice(0, maxLen).trimEnd() + "…";
}


export function SearchResults() {
  const [params] = useSearchParams();
  const term = (params.get("s") || "").trim();

  const { data, loading, error, fetchMore, networkStatus } = useQuery(
    SEARCH_QUERY,
    {
      variables: { term, first: PAGE_SIZE, after: null },
      skip: !term,
      fetchPolicy: "cache-and-network",
      notifyOnNetworkStatusChange: true,
    }
  );

  const nodes = data?.contentNodes?.nodes || [];
  const pageInfo = data?.contentNodes?.pageInfo || {};
  const hasNextPage = !!pageInfo.hasNextPage;
  const endCursor = pageInfo.endCursor || null;

  const isLoadingMore = networkStatus === 3;

  const headerTitle = useMemo(() => `Results for "${term}"`, [term]);
  const countLabel = useMemo(
    () => `${nodes.length} results found`,
    [nodes.length]
  );

  // ✅ Wrapper classes: hereda estructura Salient (sin inline)
  const WRAP = "container-wrap milani-search";
  const MAIN = "container main-content milani-search__container";

  if (!term) {
    return (
      <div className={WRAP}>
        <div className={MAIN}>
          <div className="milani-search__empty">
            <h1 className="milani-search__title">Search</h1>
            <p className="milani-search__subtitle">Type something to search.</p>
          </div>
        </div>
      </div>
    );
  }

  // 🔥 si hay error GraphQL, muéstralo (te confirma si el schema rechazó algún campo)
  if (error) {
    return (
      <div className={WRAP}>
        <div className={MAIN}>
          <div className="milani-search__error">
            <h1 className="milani-search__title">{headerTitle}</h1>
            <p className="milani-search__errorText">
              GraphQL error: {error.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Primera carga
  if (loading && nodes.length === 0) {
    return (
      <div className={WRAP}>
        <div className={MAIN}>
          <div className="milani-search__header milani-search__header--loading">
            <h1 className="milani-search__title">{headerTitle}</h1>
            <p className="milani-search__subtitle">Searching…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={WRAP}>
      <div className={MAIN}>
        {/* Header estilo Salient */}
        <div className="milani-search__header">
          <h1 className="milani-search__title">{headerTitle}</h1>
          <div className="milani-search__count">{countLabel}</div>
        </div>

        {/* Results */}
        {nodes.length === 0 ? (
          <div className="milani-search__noresults">
            <p className="milani-search__subtitle">No results.</p>
          </div>
        ) : (
          <div className="milani-search__results">
            {nodes.map((n, idx) => {
              const typeLabel = n.__typename === "Post" ? "Blog Post" : "";

              const preview =
                htmlToPreviewText(n.excerpt, 220) ||
                htmlToPreviewText(n.contentRendered, 220);

              return (
                <article
                  key={n.id}
                  className={`milani-search__item ${
                    idx === 0 ? "milani-search__item--first" : ""
                  }`}
                >
                  {/* Número circular */}
                  <div className="milani-search__index" aria-hidden="true">
                    {idx + 1}
                  </div>

                  {/* Body */}
                  <div className="milani-search__body">
                    {typeLabel && (
                      <div className="milani-search__type">{typeLabel}</div>
                    )}

                    <Link to={n.uri} className="milani-search__link">
                      <h4>{n.title || n.uri}</h4>
                    </Link>

                    {!!preview && (
                      <div className="milani-search__excerpt"><p>{preview}</p></div>
                    )}
                  </div>
                </article>
              );
            })}

            {/* Load more */}
            {hasNextPage && (
              <div className="milani-search__load">
                <button
                  type="button"
                  className="milani-search__loadBtn"
                  disabled={isLoadingMore}
                  onClick={() => {
                    if (!endCursor) return;

                    fetchMore({
                      variables: { term, first: PAGE_SIZE, after: endCursor },
                      updateQuery: (prev, { fetchMoreResult }) => {
                        if (!fetchMoreResult) return prev;

                        const prevNodes = prev?.contentNodes?.nodes || [];
                        const nextNodes =
                          fetchMoreResult?.contentNodes?.nodes || [];

                        const seen = new Set(prevNodes.map((x) => x.id));
                        const merged = [
                          ...prevNodes,
                          ...nextNodes.filter((x) => !seen.has(x.id)),
                        ];

                        return {
                          ...prev,
                          contentNodes: {
                            ...fetchMoreResult.contentNodes,
                            nodes: merged,
                          },
                        };
                      },
                    });
                  }}
                >
                  {isLoadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
