import { useMemo, useState } from "react";

export const FormModal = ({ setShowFormModal }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    address: "",
    phone: "",
    subscribeEmail: false,
    subscribeSms: false,
  });

  const [isSending, setIsSending] = useState(false);
  const [sentMessage, setSentMessage] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const wpBaseUrl = useMemo(() => {
    return (import.meta.env.VITE_WP_BASE_URL || "").replace(/\/$/, "");
  }, []);

  const ajaxUrl = useMemo(() => {
  return `${wpBaseUrl}/wp-admin/admin-ajax.php`;
}, [wpBaseUrl]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setSubmitError("");
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      address: "",
      phone: "",
      subscribeEmail: false,
      subscribeSms: false,
    });
    setFieldErrors({});
    setSubmitError("");
  };

  const closeModal = () => {
    if (isSending) return;
    resetForm();
    setSentMessage(false);
    setShowFormModal(false);
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required.";
    } else {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
      if (!emailOk) {
        nextErrors.email = "Please enter a valid email address.";
      }
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSentMessage(false);
    setSubmitError("");

    if (!validateForm()) return;

    if (!wpBaseUrl) {
  setSubmitError("VITE_WP_BASE_URL is not configured.");
  return;
}

    setIsSending(true);

    try {
      const body = new URLSearchParams();
      body.append("action", "milani_get_offer_submit");

      body.append("offer_full_name", formData.fullName || "");
      body.append("offer_email", formData.email || "");
      body.append("offer_address", formData.address || "");
      body.append("offer_phone", formData.phone || "");
      body.append("offer_subscribe_email", formData.subscribeEmail ? "Yes" : "No");
      body.append("offer_subscribe_sms", formData.subscribeSms ? "Yes" : "No");
      body.append("_offer_form_guard", "ok");

      const response = await fetch(ajaxUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        body: body.toString(),
      });

      const rawText = await response.text();
      console.log("🟡 [FormModal/GetOffer] AJAX status:", response.status);
      console.log("🟡 [FormModal/GetOffer] AJAX raw response:", rawText);

      let json = null;
      try {
        json = JSON.parse(rawText);
      } catch (err) {
        console.warn("⚠️ [FormModal/GetOffer] Response is not valid JSON");
      }

      if (!response.ok) {
        const backendErrors = json?.data?.errors || {};
        const backendMessage =
          json?.data?.message ||
          json?.message ||
          `Request failed with status ${response.status}.`;

        if (Object.keys(backendErrors).length) {
          setFieldErrors((prev) => ({
            ...prev,
            ...backendErrors,
          }));
        }

        setSubmitError(backendMessage);
        return;
      }

      if (!json?.success) {
        const backendErrors = json?.data?.errors || {};
        const backendMessage =
          json?.data?.message || "We couldn't submit your request.";

        if (Object.keys(backendErrors).length) {
          setFieldErrors((prev) => ({
            ...prev,
            ...backendErrors,
          }));
        }

        setSubmitError(backendMessage);
        return;
      }

      console.log("✅ [FormModal/GetOffer] Submit success:", json);

      resetForm();
      setSentMessage(true);

      setTimeout(() => {
        setSentMessage(false);
      }, 5000);
    } catch (error) {
      console.error("❌ [FormModal/GetOffer] Submit error:", error);
      setSubmitError(
        "A network error occurred while sending your request. Please try again."
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="modal-overlay-form" onClick={closeModal}>
      <div
        className="form-container form-container--offer"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="close-btn-form"
          type="button"
          onClick={closeModal}
          disabled={isSending}
        >
          ✕
        </button>

        <div className="offer-modal-header">
          <h2 className="offer-modal-title">Get this Offer</h2>
          <p className="offer-modal-subtitle">
            <b>
              A representative will contact you to
              <br />
              complete the process
            </b>
          </p>
        </div>

        <form className="contact-form offer-contact-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              name="fullName"
              className="form-input"
              placeholder="Full name*"
              required
              value={formData.fullName}
              onChange={onChange}
              disabled={isSending}
            />
            {fieldErrors.fullName && (
              <div className="form-error-message">{fieldErrors.fullName}</div>
            )}
          </div>

          <div className="form-group">
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="Email Address*"
              required
              value={formData.email}
              onChange={onChange}
              disabled={isSending}
            />
            {fieldErrors.email && (
              <div className="form-error-message">{fieldErrors.email}</div>
            )}
          </div>

          <div className="form-group">
            <input
              type="text"
              name="address"
              className="form-input"
              placeholder="Address"
              value={formData.address}
              onChange={onChange}
              disabled={isSending}
            />
          </div>

          <div className="form-group">
            <input
              type="tel"
              name="phone"
              className="form-input"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={onChange}
              disabled={isSending}
            />
          </div>

          <div className="offer-consent-block">
            <p className="offer-consent-text">
              I would like to receive promotions and
              <br />
              seasonal reminders from Milani.
            </p>

            <div className="offer-consent-options">
              <label className="offer-checkbox">
                <input
                  type="checkbox"
                  name="subscribeEmail"
                  checked={formData.subscribeEmail}
                  onChange={onChange}
                  disabled={isSending}
                />
                
                  Via <b>Email</b>
                
              </label>

              <label className="offer-checkbox">
                <input
                  type="checkbox"
                  name="subscribeSms"
                  checked={formData.subscribeSms}
                  onChange={onChange}
                  disabled={isSending}
                />
               
                  Via <b>SMS</b>
                
              </label>
            </div>
          </div>

          {submitError && (
            <div
              className="form-error-message"
              style={{ marginTop: "12px", color: "#CE2229", fontWeight: 600 }}
            >
              {submitError}
            </div>
          )}

          <button
            type="submit"
            className="submit-btn offer-submit-btn"
            disabled={isSending}
          >
            {isSending ? "SENDING..." : "SEND"}
          </button>

          {sentMessage && (
            <div
              className="form-success-message"
              style={{ marginTop: "12px", color: "green", fontWeight: 600 }}
            >
              Your information was sent successfully.
            </div>
          )}
        </form>
      </div>
    </div>
  );
};