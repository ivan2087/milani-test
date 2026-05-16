import { useMemo, useState } from "react";
import "./book-service-stepper-modal.css";
import milaniVan from "../../assets/milani-van.png";

const serviceIcons = import.meta.glob("../../assets/services/*.svg", {
  eager: true,
});

const getServiceIcon = (file) => {
  const path = `../../assets/services/${file}`;
  return serviceIcons[path]?.default || "";
};

const STEPS = [
  { key: "service", label: "Service" },
  { key: "location", label: "Location" },
  { key: "schedule", label: "Schedule" },
  { key: "contact", label: "Contact" },
];

const SERVICE_ITEMS = [
  { key: "heating", label: "Heating", icon: "heating.svg" },
  { key: "cooling", label: "Cooling", icon: "cooling.svg" },
  { key: "plumbing", label: "Plumbing", icon: "plumbing.svg" },
  { key: "drainage", label: "Drainage", icon: "drainage.svg" },
  { key: "hot-water", label: "Hot Water", icon: "hot-water.svg" },
  { key: "electrical", label: "Electrical", icon: "electrical.svg" },
  { key: "solar-energy", label: "Solar Energy", icon: "solar-energy.svg" },
  { key: "commercial", label: "Commercial", icon: "commercial.svg" },
];

const SERVICE_OPTIONS = [
  { key: "repair", label: "Repair" },
  { key: "installation", label: "Installation" },
  { key: "other", label: "Other" },
];

const getInitialFormData = (currentLocation = "") => ({
  serviceCategory: "",
  serviceOption: "",
  streetAddress: "",
  unit: "",
  city: currentLocation || "",
  postalCode: "",
  instructions: "",
  preferredDate: "",
  fullName: "",
  email: "",
  phone: "",
  subscribeEmail: false,
  subscribeSms: false,
});

export function BookServiceStepperModal({
  setShowFormModal,
  currentPhone,
  currentLocation,
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(getInitialFormData(currentLocation));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const safePhone = useMemo(() => {
    return (
      currentPhone || localStorage.getItem("currentPhone") || "604-888-8888"
    );
  }, [currentPhone]);

  const wpBaseUrl = useMemo(() => {
    return (import.meta.env.VITE_WP_BASE_URL || "").replace(/\/$/, "");
  }, []);

  const ajaxUrl = useMemo(() => {
    return `${wpBaseUrl}/wp-admin/admin-ajax.php`;
  }, [wpBaseUrl]);

  const todayStart = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const resetAll = () => {
    setStep(1);
    setErrors({});
    setSubmitError("");
    setIsSubmitting(false);
    setFormData(getInitialFormData(currentLocation));

    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const closeModal = () => {
    resetAll();
    setShowFormModal(false);
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setSubmitError("");
  };

  const onSelectService = (serviceKey) => {
    setFormData((prev) => ({
      ...prev,
      serviceCategory: serviceKey,
    }));

    setErrors((prev) => ({
      ...prev,
      serviceCategory: "",
    }));

    setSubmitError("");
  };

  const onSelectOption = (optionKey) => {
    setFormData((prev) => ({
      ...prev,
      serviceOption: optionKey,
    }));

    setErrors((prev) => ({
      ...prev,
      serviceOption: "",
    }));

    setSubmitError("");
  };

  const onSelectDate = (dateStr) => {
    setFormData((prev) => ({
      ...prev,
      preferredDate: dateStr,
    }));

    setErrors((prev) => ({
      ...prev,
      preferredDate: "",
    }));

    setSubmitError("");
  };

  const validateStep1 = () => {
    const nextErrors = {};

    if (!formData.serviceCategory) {
      nextErrors.serviceCategory = "Please select a service.";
    }

    if (!formData.serviceOption) {
      nextErrors.serviceOption = "Please choose an option.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep2 = () => {
    const nextErrors = {};

    if (!formData.streetAddress.trim()) {
      nextErrors.streetAddress = "Street address is required.";
    }

    if (!formData.city.trim()) {
      nextErrors.city = "City is required.";
    }

    if (!formData.postalCode.trim()) {
      nextErrors.postalCode = "Postal code is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep3 = () => {
    const nextErrors = {};

    if (!formData.preferredDate) {
      nextErrors.preferredDate = "Please select your preferred service date.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep4 = () => {
    const nextErrors = {};

    if (!formData.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }

    if (!formData.phone.trim()) {
      nextErrors.phone = "Phone number is required.";
    }

    if (formData.email.trim()) {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
      if (!emailOk) {
        nextErrors.email = "Please enter a valid email address.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitBooking = async () => {
    if (!wpBaseUrl) {
      setSubmitError("VITE_WP_BASE_URL is not configured.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    setErrors({});

    try {
      const body = new URLSearchParams();
      body.append("action", "milani_book_service_submit");

      body.append("booking_service_category", formData.serviceCategory || "");
      body.append("booking_service_option", formData.serviceOption || "");
      body.append("booking_street_address", formData.streetAddress || "");
      body.append("booking_unit", formData.unit || "");
      body.append("booking_city", formData.city || "");
      body.append("booking_postal_code", formData.postalCode || "");
      body.append("booking_instructions", formData.instructions || "");
      body.append("booking_preferred_date", formData.preferredDate || "");
      body.append("booking_full_name", formData.fullName || "");
      body.append("booking_email", formData.email || "");
      body.append("booking_phone", formData.phone || "");
      body.append("booking_subscribe_email", formData.subscribeEmail ? "Yes" : "No");
      body.append("booking_subscribe_sms", formData.subscribeSms ? "Yes" : "No");

      body.append("_booking_form_guard", "ok");

      const response = await fetch(ajaxUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        body: body.toString(),
      });

      const rawText = await response.text();
      console.log("🟡 AJAX status:", response.status);
      console.log("🟡 AJAX raw response:", rawText);

      let json = null;
      try {
        json = JSON.parse(rawText);
      } catch (e) {
        console.warn("⚠️ Response is not valid JSON");
      }

      if (!response.ok) {
        const backendErrors = json?.data?.errors || {};
        const backendMessage =
          json?.data?.message ||
          json?.message ||
          `Request failed with status ${response.status}.`;

        if (Object.keys(backendErrors).length) {
          setErrors(backendErrors);
        }

        setSubmitError(backendMessage);
        return;
      }

      if (!json?.success) {
        const backendErrors = json?.data?.errors || {};
        const backendMessage =
          json?.data?.message || "We couldn't submit your request.";

        if (Object.keys(backendErrors).length) {
          setErrors(backendErrors);
        }

        setSubmitError(backendMessage);
        return;
      }

      console.log("✅ Submit success:", json);
      setStep(5);
    } catch (error) {
      console.error("❌ Submit error:", error);
      setSubmitError(
        "A network error occurred while sending your request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = async () => {
    if (isSubmitting) return;

    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!validateStep2()) return;
      setStep(3);
      return;
    }

    if (step === 3) {
      if (!validateStep3()) return;
      setStep(4);
      return;
    }

    if (step === 4) {
      if (!validateStep4()) return;
      await submitBooking();
    }
  };

  const handleBack = () => {
    if (isSubmitting) return;
    if (step <= 1) return;
    if (step === 5) {
      setStep(4);
      return;
    }
    setStep((prev) => prev - 1);
    setSubmitError("");
  };

  const monthLabel = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startDay = firstDayOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];

    for (let i = startDay - 1; i >= 0; i -= 1) {
      const dayNumber = prevMonthDays - i;
      const d = new Date(year, month - 1, dayNumber);
      days.push({
        key: `prev-${dayNumber}`,
        dayNumber,
        date: d,
        currentMonth: false,
      });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const d = new Date(year, month, day);
      days.push({
        key: `curr-${day}`,
        dayNumber: day,
        date: d,
        currentMonth: true,
      });
    }

    while (days.length < 35) {
      const nextDayNumber = days.length - (startDay + daysInMonth) + 1;
      const d = new Date(year, month + 1, nextDayNumber);
      days.push({
        key: `next-${nextDayNumber}`,
        dayNumber: nextDayNumber,
        date: d,
        currentMonth: false,
      });
    }

    return days;
  }, [currentMonth]);

  const renderStepHeader = () => {
    if (step === 5) {
      return null;
    }

    return (
      <div className="milani-booking-steps">
        {STEPS.map((item, index) => {
          const number = index + 1;
          const isActive = step === number;
          const isDone = step > number;

          return (
            <div
              key={item.key}
              className={`milani-booking-steps__item ${
                isActive ? "is-active" : ""
              } ${isDone ? "is-done" : ""}`}
            >
              <div className="milani-booking-steps__label">{item.label}</div>
              <div className="milani-booking-steps__dot" />
            </div>
          );
        })}
      </div>
    );
  };

  const renderStep1 = () => {
    return (
      <>
        <div className="milani-booking-modal__section">
          <h3 className="milani-booking-modal__question">
            What service are you looking for?
          </h3>

          <div className="milani-booking-services-grid">
            {SERVICE_ITEMS.map((item) => {
              const checked = formData.serviceCategory === item.key;

              return (
                <label
                  key={item.key}
                  className={`milani-booking-service-card ${
                    checked ? "is-selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="serviceCategory"
                    value={item.key}
                    checked={checked}
                    onChange={() => onSelectService(item.key)}
                    className="milani-booking-service-card__input"
                    disabled={isSubmitting}
                  />

                  <div className="milani-booking-service-card__icon">
                    <img src={getServiceIcon(item.icon)} alt={item.label} />
                  </div>

                  <div className="milani-booking-service-card__label">
                    {item.label}
                  </div>
                </label>
              );
            })}
          </div>

          {errors.serviceCategory && (
            <div className="milani-booking-modal__error">
              {errors.serviceCategory}
            </div>
          )}
        </div>

        <div className="milani-booking-modal__separator" />

        <div className="milani-booking-modal__section">
          <h3 className="milani-booking-modal__subquestion">
            Please choose an option
          </h3>

          <div className="milani-booking-option-buttons">
            {SERVICE_OPTIONS.map((item) => {
              const checked = formData.serviceOption === item.key;

              return (
                <label
                  key={item.key}
                  className={`milani-booking-option-btn ${
                    checked ? "is-selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="serviceOption"
                    value={item.key}
                    checked={checked}
                    onChange={() => onSelectOption(item.key)}
                    className="milani-booking-option-btn__input"
                    disabled={isSubmitting}
                  />
                  {item.label}
                </label>
              );
            })}
          </div>

          {errors.serviceOption && (
            <div className="milani-booking-modal__error">
              {errors.serviceOption}
            </div>
          )}
        </div>
      </>
    );
  };

  const renderStep2 = () => {
    return (
      <div className="milani-booking-modal__section">
        <h3 className="milani-booking-modal__question">
          Where are we heading?
        </h3>

        <div className="milani-booking-form">
          <div className="milani-booking-field">
            <input
              type="text"
              name="streetAddress"
              placeholder="Street Address"
              value={formData.streetAddress}
              onChange={onChange}
              disabled={isSubmitting}
            />
            {errors.streetAddress && (
              <div className="milani-booking-modal__error">
                {errors.streetAddress}
              </div>
            )}
          </div>

          <div className="milani-booking-field">
            <input
              type="text"
              name="unit"
              placeholder="Apartment, Suite, Unit"
              value={formData.unit}
              onChange={onChange}
              disabled={isSubmitting}
            />
          </div>

          <div className="milani-booking-field">
            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={onChange}
              disabled={isSubmitting}
            />
            {errors.city && (
              <div className="milani-booking-modal__error">{errors.city}</div>
            )}
          </div>

          <div className="milani-booking-field milani-booking-field--short">
            <input
              type="text"
              name="postalCode"
              placeholder="Postal Code"
              value={formData.postalCode}
              onChange={onChange}
              disabled={isSubmitting}
            />
            {errors.postalCode && (
              <div className="milani-booking-modal__error">
                {errors.postalCode}
              </div>
            )}
          </div>

          <div className="milani-booking-field">
            <textarea
              name="instructions"
              placeholder="Other Instructions"
              rows="3"
              value={formData.instructions}
              onChange={onChange}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    return (
      <div className="milani-booking-modal__section">
        <h3 className="milani-booking-modal__question">
          What is your preferred service date?
        </h3>

        <div className="milani-booking-calendar">
          <div className="milani-booking-calendar__header">
            <button
              type="button"
              className="milani-booking-calendar__nav"
              onClick={() =>
                setCurrentMonth(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() - 1,
                    1
                  )
                )
              }
              aria-label="Previous month"
              disabled={isSubmitting}
            >
              ‹
            </button>

            <div className="milani-booking-calendar__month">{monthLabel}</div>

            <button
              type="button"
              className="milani-booking-calendar__nav"
              onClick={() =>
                setCurrentMonth(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() + 1,
                    1
                  )
                )
              }
              aria-label="Next month"
              disabled={isSubmitting}
            >
              ›
            </button>
          </div>

          <div className="milani-booking-calendar__weekdays">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
              <div key={day} className="milani-booking-calendar__weekday">
                {day}
              </div>
            ))}
          </div>

          <div className="milani-booking-calendar__grid">
            {calendarDays.map((item) => {
              const dateStr = item.date.toISOString().split("T")[0];
              const isSelected = formData.preferredDate === dateStr;

              const itemDateStart = new Date(
                item.date.getFullYear(),
                item.date.getMonth(),
                item.date.getDate()
              );

              const isPastDate = itemDateStart < todayStart;
              const isDisabled = isSubmitting || isPastDate;

              return (
                <button
                  key={item.key}
                  type="button"
                  className={`milani-booking-calendar__day ${
                    item.currentMonth ? "" : "is-muted"
                  } ${isSelected ? "is-selected" : ""} ${
                    isPastDate ? "is-disabled" : ""
                  }`}
                  onClick={() => {
                    if (isPastDate) return;
                    onSelectDate(dateStr);
                  }}
                  disabled={isDisabled}
                >
                  {item.dayNumber}
                </button>
              );
            })}
          </div>
        </div>

        {errors.preferredDate && (
          <div className="milani-booking-modal__error">
            {errors.preferredDate}
          </div>
        )}

        <div className="milani-booking-modal__separator" />

        <div className="milani-booking-note">
          <strong>Please note:</strong> Your preferred service date and time
          help us plan your visit, but availability will be confirmed by our
          team after review.
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    return (
      <div className="milani-booking-modal__section">
        <h3 className="milani-booking-modal__question">
          How should we reach you?
        </h3>

        <div className="milani-booking-form">
          <div className="milani-booking-field">
            <input
              type="text"
              name="fullName"
              placeholder="Full name*"
              value={formData.fullName}
              onChange={onChange}
              disabled={isSubmitting}
            />
            {errors.fullName && (
              <div className="milani-booking-modal__error">
                {errors.fullName}
              </div>
            )}
          </div>

          <div className="milani-booking-field">
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={onChange}
              disabled={isSubmitting}
            />
            {errors.email && (
              <div className="milani-booking-modal__error">{errors.email}</div>
            )}
          </div>

          <div className="milani-booking-field">
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number*"
              value={formData.phone}
              onChange={onChange}
              disabled={isSubmitting}
            />
            {errors.phone && (
              <div className="milani-booking-modal__error">{errors.phone}</div>
            )}
          </div>
        </div>

        <div className="milani-booking-modal__separator milani-booking-modal__separator--spaced" />

        <div className="milani-booking-subscribe">
          <h2>Stay in the loop!</h2>

          <p className="milani-booking-subscribe__text">
            By subscribing, you agree to receive emails with news and special
            offers from Milani. You can unsubscribe anytime
          </p>

          <div className="milani-booking-subscribe__options">
            <label className="milani-booking-checkbox">
              <input
                type="checkbox"
                name="subscribeEmail"
                checked={formData.subscribeEmail}
                onChange={onChange}
                disabled={isSubmitting}
              />
              Via <b>Email</b>
            </label>

            <label className="milani-booking-checkbox">
              <input
                type="checkbox"
                name="subscribeSms"
                checked={formData.subscribeSms}
                onChange={onChange}
                disabled={isSubmitting}
              />
              Via <b>SMS</b>
            </label>
          </div>
        </div>

        {submitError && (
          <div className="milani-booking-modal__error milani-booking-modal__error--submit">
            {submitError}
          </div>
        )}
      </div>
    );
  };

  const renderStep5 = () => {
    return (
      <div className="milani-booking-thankyou">
        <h2 className="milani-booking-thankyou__title">Thank You!</h2>
        <p className="milani-booking-thankyou__text">
          Your request has been received.
        </p>
        <p className="milani-booking-thankyou__text">
          A representative will reach out within 24 hours.
        </p>
      </div>
    );
  };

  return (
    <div className="milani-booking-modal-overlay" onClick={closeModal}>
      <div
        className={`milani-booking-modal ${
          step === 5 ? "milani-booking-modal--thankyou" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="milani-booking-modal__close"
          onClick={closeModal}
          aria-label="Close"
          disabled={isSubmitting}
        >
          ✕
        </button>

        <div className="milani-booking-modal__header">
          <div className="milani-booking-modal__brand">
            <div className="milani-booking-modal__truck">
              <img src={milaniVan} alt="Milani Service Van" />
            </div>
          </div>

          <h1 className="milani-booking-modal__title">Book Your Service</h1>
        </div>

        {renderStepHeader()}

        <div className="milani-booking-modal__body">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
        </div>

        <div className="milani-booking-modal__footer">
          <a
            className="milani-booking-modal__rep"
            href={`tel:+1${safePhone.replace(/\D/g, "")}`}
          >
            <div className="milani-booking-modal__rep-icon">
              <svg
                width="35"
                height="35"
                viewBox="0 0 35 35"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_291_1414)">
                  <path
                    d="M9.21558 10.7846C9.21558 12.0688 9.51953 13.2845 9.99011 14.461C10.9117 16.7746 12.1666 18.8828 13.843 20.7357C14.7156 21.6965 15.6958 22.5297 16.9115 23.0296C17.637 23.3336 18.3919 23.4807 19.1762 23.3532C19.3527 23.3238 19.5292 23.2653 19.686 23.1771C20.1762 22.9026 20.6566 22.6179 21.137 22.3336C21.4899 22.1277 21.5977 21.7751 21.3919 21.4222C20.7154 20.2653 20.0389 19.1082 19.3624 17.9612C19.1565 17.6083 18.8037 17.5301 18.4409 17.7458C17.9605 18.0203 17.49 18.304 17.0096 18.5883C16.6371 18.804 16.3626 18.8137 16.0489 18.5098C15.7352 18.2157 15.4213 17.9027 15.1958 17.5399C14.5978 16.5792 14.0195 15.5986 13.4705 14.6084C13.2254 14.1574 13.0587 13.667 12.8627 13.1867C12.8136 13.069 12.7939 12.9321 12.7743 12.8047C12.7155 12.4027 12.8038 12.2358 13.1567 12.0397C13.6273 11.7652 14.1077 11.4911 14.5783 11.2068C14.9509 10.9813 15.0391 10.6372 14.8234 10.2647C14.1862 9.16667 13.539 8.06927 12.892 6.97125C12.7547 6.73596 12.5587 6.58902 12.2841 6.59882C12.1763 6.59882 12.0685 6.63788 11.9705 6.6869C11.4509 6.99082 10.941 7.29443 10.4312 7.59834C10.0881 7.80422 9.87242 8.1377 9.69595 8.49063C9.33321 9.21611 9.21558 9.99045 9.21558 10.7846Z"
                    fill="black"
                  />
                  <path
                    d="M14.9998 30C6.72541 30 0 23.2739 0 14.9995C0 6.72517 6.72541 0 14.9998 0C23.2741 0 29.9995 6.72517 29.9995 14.9995C29.9995 23.2739 23.2741 30 14.9998 30ZM14.9998 2.81379C8.2744 2.81379 2.81379 8.28396 2.81379 14.9995C2.81379 21.7151 8.2842 27.1862 14.9998 27.1862C21.7153 27.1862 27.1859 21.7151 27.1859 14.9995C27.1859 8.28396 21.7153 2.81379 14.9998 2.81379Z"
                    fill="black"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_291_1414">
                    <rect width="30" height="30" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>

            <div className="milani-booking-modal__rep-text">
              Talk to a representative
            </div>
          </a>

          <div className="milani-booking-modal__actions">
            {step === 5 ? (
              <button
                type="button"
                className="milani-booking-modal__btn milani-booking-modal__btn--primary"
                onClick={closeModal}
              >
                CLOSE
              </button>
            ) : (
              <>
                {step > 1 && (
                  <button
                    type="button"
                    className="milani-booking-modal__btn milani-booking-modal__btn--secondary"
                    onClick={handleBack}
                    disabled={isSubmitting}
                  >
                    BACK
                  </button>
                )}

                <button
                  type="button"
                  className="milani-booking-modal__btn milani-booking-modal__btn--primary"
                  onClick={handleContinue}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "SENDING..."
                    : step === 4
                    ? "BOOK NOW"
                    : "CONTINUE"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}