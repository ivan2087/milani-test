// src/pages/CategoryTemplate.jsx
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { Link, useParams } from "react-router-dom";
import { wpToPlainText } from "../helpers/wpToPlainText";
import "./category-template.css";

const GET_CATEGORY_PAGE = gql`
  query GetCategoryPage($slug: ID!, $first: Int!) {
    category(id: $slug, idType: SLUG) {
      id
      name
      slug
      posts(first: $first, where: { orderby: { field: DATE, order: DESC } }) {
        nodes {
          id
          title
          excerpt
          contentRendered
          date
          uri
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
        }
      }
    }
  }
`;

function formatDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export default function CategoryTemplate() {
  const { slug } = useParams();

  const { data, loading, error } = useQuery(GET_CATEGORY_PAGE, {
    variables: { slug, first: 24 },
    fetchPolicy: "cache-first",
  });

  if (loading) return null;
  if (error) return <div style={{ padding: 24 }}>Error loading category.</div>;

  const category = data?.category;
  const posts = category?.posts?.nodes || [];

  if (!category) {
    return <div style={{ padding: 24 }}>Category not found.</div>;
  }

  return (
    <div className="cat-page">
      {/* ✅ Header estilo Salient */}
      <header className="cat-hero col span_12 section-title">
        <div className="cat-hero__kicker">
          <span className="subheader">Category</span>
        </div>
        <h1 className="cat-hero__title">{category.name}</h1>
      </header>

      <section className="cat-grid">
        {posts.map((p) => {
          const img = p?.featuredImage?.node?.sourceUrl || "";
          const alt = p?.featuredImage?.node?.altText || p?.title || "";
          const dateLabel = formatDate(p?.date);

          // ✅ Excerpt limpio (si queda vacío, fallback a contentRendered)
          const excerptText =
            wpToPlainText(p?.excerpt || "", 140) ||
            wpToPlainText(p?.contentRendered || "", 140);

          return (
            <article key={p.id} className="cat-card">
              <Link to={p.uri} className="cat-card__mediaLink">
                <div className="cat-card__media">
                  {img ? (
                    <img className="cat-card__img" src={img} alt={alt} />
                  ) : (
                    <div className="cat-card__imgPlaceholder" />
                  )}

                  <div className="cat-card__tag">
                    {(category.name || "").toUpperCase()}
                  </div>
                </div>
              </Link>

              <div className="cat-card__meta">{dateLabel}</div>

              {/* ✅ Título con clase Salient */}
              <h3 className="title">
                <Link to={p.uri} className="cat-card__titleLink">
                  {p.title}
                </Link>
              </h3>

              {!!excerptText && (
                <p className="cat-card__excerpt">{excerptText}</p>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
