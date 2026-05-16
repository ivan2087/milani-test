// src/WpPage.jsx

import { Helmet } from "react-helmet-async";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useLocation } from "react-router-dom";
import DOMPurify from "dompurify";
import { useEffect, useMemo, useState } from "react";
import { usePageCss } from "./hooks/usePageCss";
import { useWpReflow } from "./hooks/useWpReflow";
import useIframeReflow from "./hooks/useIframeReflow";
import { useSliderIslands } from "./hooks/useSliderIslands";
import { PostHeaderUnderImage } from "./components/Post/PostHeaderUnderImage";
import { useEmbedSocial } from "./hooks/useEmbedSocial";
import { locations } from "./locations";
import { buildCityIndex, isCitySlug } from "./helpers/cityIndex";

const CITY_INDEX = buildCityIndex();

const GET_BLOG_SIDEBAR = gql`
  query GetBlogSidebar($id: String!) {
    wpSidebar(id: $id)
  }
`;

const NODE_BY_PATH = gql`
  query NodeByPath($uri: ID!) {
    milaniSchemaSettings {
      enableCustomSchema
      enableLocationSchema
      enableServiceSchema
      enableFaqSchema
      enableReviewSchema
      defaultBusinessType
      defaultServiceType
      sameAs
      globalFaqs {
        question
        answer
      }
      globalReviews {
        author
        reviewBody
        ratingValue
        datePublished
      }
    }

    contentNode(id: $uri, idType: URI) {
      __typename
      id
      databaseId
      uri
      slug

      ... on Page {
        title
        contentRendered
        dynamicCss
        seo {
          title
          metaDesc
          canonical
          opengraphTitle
          opengraphDescription
          opengraphImage {
            sourceUrl
          }
          twitterTitle
          twitterDescription
          twitterImage {
            sourceUrl
          }
          schema {
            raw
          }
        }
        inlineDynamicCssGrouped {
          emoji
          global
          main
          dynamic
        }
      }

      ... on Post {
        title
        contentRendered
        dynamicCss
        date
        modified
        seo {
          title
          metaDesc
          canonical
          opengraphTitle
          opengraphDescription
          opengraphImage {
            sourceUrl
          }
          twitterTitle
          twitterDescription
          twitterImage {
            sourceUrl
          }
          schema {
            raw
          }
        }
        categories {
          nodes {
            name
            slug
            uri
          }
        }
        featuredImage {
          node {
            sourceUrl
            srcSet
            sizes
            altText
          }
        }
        inlineDynamicCssGrouped {
          emoji
          global
          main
          dynamic
        }
      }

      ... on Career {
        title
        contentRendered
        dynamicCss
        seo {
          title
          metaDesc
          canonical
          opengraphTitle
          opengraphDescription
          opengraphImage {
            sourceUrl
          }
          twitterTitle
          twitterDescription
          twitterImage {
            sourceUrl
          }
          schema {
            raw
          }
        }
        inlineDynamicCssGrouped {
          emoji
          global
          main
          dynamic
        }
      }

      ... on Service {
        title
        contentRendered
        dynamicCss
        seo {
          title
          metaDesc
          canonical
          opengraphTitle
          opengraphDescription
          opengraphImage {
            sourceUrl
          }
          twitterTitle
          twitterDescription
          twitterImage {
            sourceUrl
          }
          schema {
            raw
          }
        }
        milaniServiceSchema {
          enabled
          businessType
          serviceType
          shortDescription
          includeFaq
          includeReview
          useGlobalFaqs
          useGlobalReviews
          faqs {
            question
            answer
          }
          reviews {
            author
            reviewBody
            ratingValue
            datePublished
          }
        }
        inlineDynamicCssGrouped {
          emoji
          global
          main
          dynamic
        }
      }
    }
  }
`;

const normalizeImagesHtml = (html) => {
  if (!html) return html;

  return html.replace(/<img(\s[^>]*?)>/gi, (match, attrs) => {
    const hasStyle = /\bstyle\s*=/i.test(attrs);
    const hasLoading = /\bloading\s*=/i.test(attrs);
    const hasDecoding = /\bdecoding\s*=/i.test(attrs);

    let nextAttrs = attrs;

    if (!hasStyle) {
      nextAttrs += ' style="max-width:100%;height:auto;"';
    }

    if (!hasLoading) {
      nextAttrs += ' loading="lazy"';
    }

    if (!hasDecoding) {
      nextAttrs += ' decoding="async"';
    }

    return `<img${nextAttrs}>`;
  });
};

function safeParseJson(raw) {
  if (!raw || typeof raw !== "string") return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getStoredValue(key, fallback = "") {
  if (typeof window === "undefined") return fallback;

  try {
    const value = window.localStorage.getItem(key);
    return value && value !== "null" ? value : fallback;
  } catch {
    return fallback;
  }
}

function getRegionRecord(regionSlug) {
  if (!regionSlug) return null;

  const normalized = String(regionSlug).trim().toLowerCase();

  return (
    locations.find(
      (item) =>
        String(item.slug || "")
          .trim()
          .toLowerCase() === normalized
    ) || null
  );
}

function cleanObject(obj) {
  if (Array.isArray(obj)) {
    return obj
      .map(cleanObject)
      .filter((value) => value !== undefined && value !== null && value !== "");
  }

  if (obj && typeof obj === "object") {
    const next = {};

    Object.entries(obj).forEach(([key, value]) => {
      const cleaned = cleanObject(value);

      if (
        cleaned !== undefined &&
        cleaned !== null &&
        cleaned !== "" &&
        !(Array.isArray(cleaned) && cleaned.length === 0)
      ) {
        next[key] = cleaned;
      }
    });

    return next;
  }

  return obj;
}

function buildCustomSchemaGraph({
  node,
  schemaSettings,
  serviceSchemaConfig,
  currentCity,
  currentPhone,
  regionRecord,
}) {
  if (!node || node.__typename !== "Service") return [];
  if (!schemaSettings?.enableCustomSchema) return [];
  if (!schemaSettings?.enableServiceSchema) return [];
  if (!serviceSchemaConfig?.enabled) return [];

  const businessType =
    serviceSchemaConfig?.businessType ||
    schemaSettings?.defaultBusinessType ||
    "LocalBusiness";

  const serviceType =
    serviceSchemaConfig?.serviceType ||
    schemaSettings?.defaultServiceType ||
    "Service";

  const sameAs = Array.isArray(schemaSettings?.sameAs)
    ? schemaSettings.sameAs.filter(Boolean)
    : [];

  const provider = cleanObject({
    "@type": businessType,
    name: "Milani Plumbing Heating & Air Conditioning",
    telephone: currentPhone || undefined,
    contactPoint: currentPhone
      ? [
          {
            "@type": "ContactPoint",
            telephone: currentPhone,
            contactType: "customer service",
            areaServed: currentCity || undefined,
            availableLanguage: ["English"],
          },
        ]
      : undefined,
    address: regionRecord?.address
      ? {
          "@type": "PostalAddress",
          streetAddress: regionRecord.address,
          addressCountry: "CA",
        }
      : undefined,
    areaServed: currentCity
      ? {
          "@type": "City",
          name: currentCity,
        }
      : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  });

  const serviceNode = cleanObject({
    "@type": serviceType,
    name: node?.title || "Service",
    description:
      serviceSchemaConfig?.shortDescription ||
      node?.seo?.metaDesc ||
      node?.title ||
      undefined,
    serviceType: node?.title || undefined,
    areaServed: currentCity
      ? {
          "@type": "City",
          name: currentCity,
        }
      : undefined,
    provider,
  });

  const graph = [];

  if (serviceNode) {
    graph.push(serviceNode);
  }

  const faqItems =
    serviceSchemaConfig?.includeFaq && schemaSettings?.enableFaqSchema
      ? Array.isArray(serviceSchemaConfig?.faqs)
        ? serviceSchemaConfig.faqs.filter(
            (item) => item?.question && item?.answer
          )
        : []
      : [];

  if (faqItems.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) =>
        cleanObject({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })
      ),
    });
  }

  const reviewItems =
    serviceSchemaConfig?.includeReview && schemaSettings?.enableReviewSchema
      ? Array.isArray(serviceSchemaConfig?.reviews)
        ? serviceSchemaConfig.reviews.filter(
            (item) => item?.author && item?.reviewBody
          )
        : []
      : [];

  if (reviewItems.length) {
    reviewItems.forEach((item) => {
      graph.push(
        cleanObject({
          "@type": "Review",
          author: {
            "@type": "Person",
            name: item.author,
          },
          reviewBody: item.reviewBody,
          reviewRating: item.ratingValue
            ? {
                "@type": "Rating",
                ratingValue: item.ratingValue,
                bestRating: 5,
              }
            : undefined,
          datePublished: item.datePublished || undefined,
          itemReviewed: {
            "@type": serviceType,
            name: node?.title || "Service",
          },
        })
      );
    });
  }

  return graph;
}

function mergeYoastSchemaWithCustom(rawSchema, customGraph) {
  if (!rawSchema && (!customGraph || !customGraph.length)) {
    return "";
  }

  const parsed = safeParseJson(rawSchema);

  if (!parsed) {
    if (rawSchema) {
      return rawSchema;
    }

    if (customGraph?.length) {
      return JSON.stringify(
        {
          "@context": "https://schema.org",
          "@graph": customGraph,
        },
        null,
        2
      );
    }

    return "";
  }

  if (!customGraph || !customGraph.length) {
    return JSON.stringify(parsed, null, 2);
  }

  if (Array.isArray(parsed)) {
    return JSON.stringify(
      {
        "@context": "https://schema.org",
        "@graph": [...parsed, ...customGraph],
      },
      null,
      2
    );
  }

  if (parsed?.["@graph"] && Array.isArray(parsed["@graph"])) {
    return JSON.stringify(
      {
        ...parsed,
        "@graph": [...parsed["@graph"], ...customGraph],
      },
      null,
      2
    );
  }

  return JSON.stringify(
    {
      "@context": parsed?.["@context"] || "https://schema.org",
      "@graph": [parsed, ...customGraph],
    },
    null,
    2
  );
}

export function WpPage({ fixedUri, fixedSlug }) {
  const location = useLocation();
  const { pathname } = location;
  const [deferContent, setDeferContent] = useState(false);

  const REGIONS = [
    "okanagan",
    "calgary",
    "lowermainland",
    "edmonton",
    "vancouverisland",
  ];

  const cleanPathname = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);

    if (parts[0] && isCitySlug(parts[0], CITY_INDEX)) {
      parts.shift();
    }

    if (parts[0] && REGIONS.includes(parts[0])) {
      parts.shift();
    }

    if (parts[0] === "service") parts.shift();

    if (parts.length === 0) return "/home/";
    return "/" + parts.join("/") + "/";
  }, [pathname]);

  const uriCandidates = useMemo(() => {
    if (fixedUri) return [fixedUri];
    if (fixedSlug) return [`/${fixedSlug}/`];

    if (cleanPathname === "/home/") {
      return ["/home/"];
    }

    return [cleanPathname, `/service${cleanPathname}`];
  }, [fixedUri, fixedSlug, cleanPathname]);

  const { data: primaryData, loading: loadingPrimary } = useQuery(NODE_BY_PATH, {
    variables: { uri: uriCandidates[0] },
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-only",
  });

  const primaryNode = primaryData?.contentNode;

  const { data: serviceData, loading: loadingService } = useQuery(NODE_BY_PATH, {
    variables: { uri: uriCandidates[1] ?? "__skip__" },
    skip: !uriCandidates[1],
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-only",
  });

  const node = primaryNode || serviceData?.contentNode;
  const loading = loadingPrimary || loadingService;

  const schemaSettings =
    primaryData?.milaniSchemaSettings ||
    serviceData?.milaniSchemaSettings ||
    null;

  const serviceSchemaConfig =
    node?.__typename === "Service" ? node?.milaniServiceSchema || null : null;

  const frontSchemaContext = useMemo(() => {
    const currentCity = getStoredValue("currentLocation", "Vancouver");
    const currentPhone = getStoredValue("currentPhone", "604-888-8888");
    const currentRegion = getStoredValue("currentRegion", "lowermainland");
    const regionRecord = getRegionRecord(currentRegion);

    return {
      currentCity,
      currentPhone,
      currentRegion,
      regionRecord,
    };
  }, [pathname]);

  const finalSchemaJson = useMemo(() => {
    const rawSchema = node?.seo?.schema?.raw || "";

    const customGraph = buildCustomSchemaGraph({
      node,
      schemaSettings,
      serviceSchemaConfig,
      currentCity: frontSchemaContext.currentCity,
      currentPhone: frontSchemaContext.currentPhone,
      regionRecord: frontSchemaContext.regionRecord,
    });

    return mergeYoastSchemaWithCustom(rawSchema, customGraph);
  }, [node, schemaSettings, serviceSchemaConfig, frontSchemaContext]);

  const isHome = useMemo(() => {
    if (pathname === "/home" || pathname === "/home/") return true;
    if (pathname === "/") return true;

    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 1 && parts[0] && isCitySlug(parts[0], CITY_INDEX)) {
      return true;
    }

    if (
      pathname === "/okanagan" ||
      pathname === "/calgary" ||
      pathname === "/edmonton" ||
      pathname === "/lowermainland" ||
      pathname === "/vancouverisland"
    ) {
      return true;
    }

    return false;
  }, [pathname]);

  useEffect(() => {
    if (isHome) {
      document.title = "Milani Plumbing Heating & Air Conditioning";
    } else if (node?.title) {
      document.title = `${node.title} – Milani Plumbing Heating & Air Conditioning`;
    }
  }, [node?.title, isHome]);

  useEffect(() => {
    if (!isHome && !node?.title) return;

    window.dataLayer = window.dataLayer || [];

    const page_title = isHome
      ? "Milani Plumbing Heating & Air Conditioning"
      : `${node.title} – Milani Plumbing Heating & Air Conditioning`;

    window.dataLayer.push({
      event: "virtual_pageview",
      page_title,
      page_path: window.location.pathname + window.location.search,
      page_location: window.location.href,
      content_type: node?.__typename || (isHome ? "Home" : "Unknown"),
      content_uri: node?.uri || null,
    });
  }, [isHome, node?.title, node?.__typename, node?.uri]);

  // Preload de la imagen LCP (hero del slider) en cuanto llegan los datos.
  // Usa regex en lugar de DOMParser para no bloquear el main thread.
  useEffect(() => {
    if (!node?.contentRendered) return;

    try {
      // Busca el primer src de img con loading="eager" o fetchpriority="high"
      const match =
        node.contentRendered.match(/\bsrc="(https?:\/\/[^"]+)"[^>]*loading="eager"/) ||
        node.contentRendered.match(/\bsrc="(https?:\/\/[^"]+)"[^>]*fetchpriority="high"/);
      const src = match?.[1];
      if (!src) return;

      if (document.querySelector('link[rel="preload"][as="image"]')) return;

      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = src;
      link.setAttribute("fetchpriority", "high");
      document.head.appendChild(link);
    } catch {}
  }, [node?.contentRendered]);

  useEffect(() => {
    setDeferContent(false);
    if (!node) return;

    const run = () => setDeferContent(true);

    // Doble RAF: renderiza en el siguiente frame disponible sin bloquear el paint inicial
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(run);
    });

    return () => cancelAnimationFrame(raf1);
  }, [node?.id]);

  usePageCss(node);

  const reflowKey = node?.uri || cleanPathname;

  const hasEmbedSocial = useMemo(() => {
    const html = node?.contentRendered || "";
    return (
      html.includes("embedsocial-hashtag") ||
      html.includes("data-ref=") ||
      html.includes("embedsocial.com")
    );
  }, [node?.contentRendered]);

  useEmbedSocial({
    key: reflowKey,
    html: hasEmbedSocial ? node?.contentRendered : "",
    debug: import.meta.env.DEV,
  });

  useWpReflow([reflowKey]);
  useIframeReflow(node?.contentRendered);
  const sliderPortals = useSliderIslands({ html: node?.contentRendered, cssReady: deferContent });

  if (!node && !loading) return null;

  const isBlogPost = node?.__typename === "Post";
  const BLOG_SIDEBAR_ID = "blog-sidebar";

  const { data: sidebarData } = useQuery(GET_BLOG_SIDEBAR, {
    variables: { id: BLOG_SIDEBAR_ID },
    skip: !isBlogPost,
    fetchPolicy: "cache-first",
  });

  const rawHtml = normalizeImagesHtml(node?.contentRendered || "");

  const safeHtml = DOMPurify.sanitize(rawHtml, {
    ADD_TAGS: ["iframe", "swiper-container", "swiper-slide", "picture", "source"],
    ADD_ATTR: [
      "allow",
      "allowfullscreen",
      "frameborder",
      "scrolling",
      "src",
      "srcdoc",
      "loading",
      "referrerpolicy",
      "width",
      "height",
      "decoding",
      "fetchpriority",
      "srcset",
      "media",
      "navigation",
      "pagination",
      "autoplay",
      "loop",
      "space-between",
    ],
  });

  const rawSidebarHtml = normalizeImagesHtml(sidebarData?.wpSidebar || "");

  const safeSidebarHtml = DOMPurify.sanitize(rawSidebarHtml, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: [
      "allow",
      "allowfullscreen",
      "frameborder",
      "scrolling",
      "src",
      "srcdoc",
      "loading",
      "referrerpolicy",
      "width",
      "height",
      "decoding",
      "fetchpriority",
      "data-milani-slider",
      "data-slides",
      "data-config",
    ],
  });

  const BLOG_END_LINE_SRC = import.meta.env.VITE_BLOG_END_LINE_SRC || "";

  return (
    <>
      {!loading && node?.seo && (
        <Helmet key={`${node?.id}-${node?.uri}`}>
          {node.seo.metaDesc && (
            <meta name="description" content={node.seo.metaDesc} />
          )}
          {node.seo.canonical && (
            <link rel="canonical" href={node.seo.canonical} />
          )}
          {node.seo.opengraphTitle && (
            <meta property="og:title" content={node.seo.opengraphTitle} />
          )}
          {node.seo.opengraphDescription && (
            <meta
              property="og:description"
              content={node.seo.opengraphDescription}
            />
          )}
          {node.seo.opengraphImage?.sourceUrl && (
            <meta
              property="og:image"
              content={node.seo.opengraphImage.sourceUrl}
            />
          )}
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
          {finalSchemaJson && (
            <script type="application/ld+json">{finalSchemaJson}</script>
          )}

          <style>{`
            @media (min-width: 1000px) {
              .milani-blog-layout {
                display: flex;
                align-items: flex-start;
                gap: 48px;
              }
              .milani-blog-main {
                flex: 1 1 auto;
                min-width: 0;
              }
              .milani-blog-aside {
                flex: 0 0 320px;
                width: 320px;
              }
              .milani-blog-sidebar {
                position: sticky;
                top: 120px;
              }
            }

            @media (max-width: 999px) {
              .milani-blog-layout {
                display: block;
              }
              .milani-blog-aside {
                margin-top: 32px;
              }
            }

            .milani-blog-endline img {
              display: block;
              max-width: 100%;
              height: auto;
            }
          `}</style>
        </Helmet>
      )}

      {node?.__typename === "Post" && <PostHeaderUnderImage post={node} />}

      {isBlogPost ? (
        <div className="milani-blog-layout">
          <div className="milani-blog-main">
            <article key={node?.id} className="wpb-content-wrapper">
              {deferContent ? (
                <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
              ) : (
                <div style={{ minHeight: "60vh" }} />
              )}
            </article>

            {BLOG_END_LINE_SRC ? (
              <div className="milani-blog-endline">
                <img
                  src={BLOG_END_LINE_SRC}
                  alt=""
                  aria-hidden="true"
                  decoding="async"
                  loading="lazy"
                />
              </div>
            ) : null}
          </div>

          <aside className="milani-blog-aside" id="sidebar">
            <div className="milani-blog-sidebar">
              <div
                className="widget-area"
                dangerouslySetInnerHTML={{ __html: safeSidebarHtml }}
              />
            </div>
          </aside>
        </div>
      ) : (
        <article key={node?.id} className="wpb-content-wrapper">
          {deferContent ? (
            <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
          ) : (
            <div style={{ minHeight: "60vh" }} />
          )}
        </article>
      )}
      {sliderPortals}
    </>
  );
}