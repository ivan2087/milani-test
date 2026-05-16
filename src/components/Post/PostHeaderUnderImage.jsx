// src/components/Post/PostHeaderUnderImage.jsx

export function PostHeaderUnderImage({ post }) {
  if (!post) return null;

  const category = post.categories?.nodes?.[0];
  const image = post.featuredImage?.node;

  // 🔹 Formateo nativo (sin dependencias)
  const formatDate = (date) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  };

  return (
    <div className="row featured-media-under-header" data-animate="none">
      <div className="featured-media-under-header__content">

        {/* CATEGORÍA */}
        {category && (
          <div className="featured-media-under-header__cat-wrap">
            <span className="meta-category nectar-inherit-label">
              <a
  className="nectar-inherit-border-radius nectar-bg-hover-accent-color trending"
  href={category?.uri || "#"}
>
  {category.name}
</a>

            </span>
          </div>
        )}

        {/* TÍTULO */}
        <h1 className="entry-title">{post.title}</h1>

        {/* FECHAS */}
        <div className="featured-media-under-header__meta-wrap nectar-link-underline-effect">
          {post.date && (
            <span className="meta-date date published">
              {formatDate(post.date)}
            </span>
          )}
          {post.modified && (
            <span className="meta-date date updated rich-snippet-hidden">
              {formatDate(post.modified)}
            </span>
          )}
        </div>
      </div>

      {/* IMAGEN DESTACADA */}
      {image && (
        <div
          className="featured-media-under-header__featured-media"
          data-has-img="true"
          data-align="center"
          data-format="default"
        >
          <span className="post-featured-img page-header-bg-image">
            <img
              src={image.sourceUrl}
              srcSet={image.srcSet}
              sizes={image.sizes}
              alt={image.altText || ""}
              decoding="async"
            />
          </span>
        </div>
      )}
    </div>
  );
}
