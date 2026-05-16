// src/components/MilaniSlider/MilaniSlider.jsx
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "./MilaniSlider.css";

const toRelativeUrl = (url) => {
  if (!url) return "";
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
};

export function MilaniSlider({ slides, config }) {
  if (!slides?.length) return null;

  const { autoplay = true, loop = true } = config || {};

  return (
    <div className="milani-slider-root">
      <Swiper
        modules={[Autoplay, Navigation, Pagination, A11y]}
        navigation={slides.length > 1}
        loop={loop && slides.length > 1}
        autoplay={autoplay ? { delay: 5000, disableOnInteraction: false } : false}
        pagination={{ clickable: true }}
        a11y={{ prevSlideMessage: "Previous slide", nextSlideMessage: "Next slide" }}
        className="milani-slider-swiper"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index}>
            <div className="milani-slide">
              <picture className="milani-slide__picture">
                <source
                  media="(max-width: 768px)"
                  srcSet={
                    toRelativeUrl(slide.imageMobile) || toRelativeUrl(slide.image)
                  }
                />
                <img
                  src={toRelativeUrl(slide.image)}
                  alt={slide.imageAlt || slide.title || ""}
                  className="milani-slide__img"
                  fetchpriority={index === 0 ? "high" : undefined}
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                  width="1920"
                  height="800"
                />
              </picture>
              <div className="milani-slide__overlay" />
              <div className="milani-slide__content">
                {slide.eyebrow && (
                  <p className="milani-slide__eyebrow">{slide.eyebrow}</p>
                )}
                <h2 className="milani-slide__title">{slide.title}</h2>
                {slide.subtitle && (
                  <p className="milani-slide__subtitle">{slide.subtitle}</p>
                )}
                {slide.ctaText && (
                  slide.ctaType === "modal" ? (
                    <button className="milani-slide__cta btn_showmodal">
                      {slide.ctaText}
                    </button>
                  ) : (
                    <a href={slide.ctaUrl} className="milani-slide__cta">
                      {slide.ctaText}
                    </a>
                  )
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
