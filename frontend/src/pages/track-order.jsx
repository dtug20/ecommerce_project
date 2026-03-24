import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import SEO from "@/components/seo";
import Wrapper from "@/layout/wrapper";
import HeaderClicon from "@/layout/headers/header-clicon";
import FooterClicon from "@/layout/footers/footer-clicon";
import ShopBreadcrumb from "@/components/breadcrumb/shop-breadcrumb";
import { useTrackOrderMutation } from "@/redux/features/order/orderApi";
import useCurrency from "@/hooks/use-currency";
import dayjs from "dayjs";

const STATUS_TO_STEP = {
  pending: 0,
  confirmed: 0,
  processing: 1,
  shipped: 2,
  delivered: 3,
};

const STEP_KEYS = [
  { key: "placed", i18n: "trackOrder.stepPlaced", icon: "fa-regular fa-clipboard" },
  { key: "processing", i18n: "trackOrder.stepPackaging", icon: "fa-solid fa-box" },
  { key: "shipped", i18n: "trackOrder.stepOnTheRoad", icon: "fa-solid fa-truck-fast" },
  { key: "delivered", i18n: "trackOrder.stepDelivered", icon: "fa-solid fa-gift" },
];

const ACTIVITY_ICONS = {
  delivered: { icon: "fa-solid fa-check-double", cls: "--delivered" },
  shipped: { icon: "fa-solid fa-truck", cls: "--shipped" },
  processing: { icon: "fa-solid fa-box-open", cls: "--processing" },
  confirmed: { icon: "fa-solid fa-circle-check", cls: "--confirmed" },
  pending: { icon: "fa-solid fa-receipt", cls: "--pending" },
  cancelled: { icon: "fa-solid fa-xmark", cls: "--cancelled" },
  cancel: { icon: "fa-solid fa-xmark", cls: "--cancel" },
};

const ACTIVITY_I18N_KEYS = {
  delivered: "trackOrder.activityDelivered",
  shipped: "trackOrder.activityShipped",
  processing: "trackOrder.activityProcessing",
  confirmed: "trackOrder.activityConfirmed",
  pending: "trackOrder.activityPending",
  cancelled: "trackOrder.activityCancelled",
  cancel: "trackOrder.activityCancelled",
};

const TrackOrderPage = () => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState("");
  const resultRef = useRef(null);

  const [trackOrder, { isLoading }] = useTrackOrderMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOrderData(null);

    if (!orderId.trim() || !email.trim()) {
      setError(t("trackOrder.fillBothFields"));
      return;
    }

    try {
      const res = await trackOrder({ orderId: orderId.trim(), email: email.trim() }).unwrap();
      setOrderData(res.data);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      const msg = err?.data?.message || t("trackOrder.noOrderFound");
      setError(msg);
    }
  };

  // Compute active step index for progress bar
  const activeStepIndex = orderData
    ? (STATUS_TO_STEP[orderData.status?.toLowerCase()] ?? -1)
    : -1;

  // Progress fill percentage (0%, 33%, 66%, 100%)
  const progressPercent = activeStepIndex <= 0 ? 0 : Math.round((activeStepIndex / (STEP_KEYS.length - 1)) * 100);

  // Build activity entries from statusHistory (newest first)
  const activityEntries = orderData?.statusHistory
    ? [...orderData.statusHistory]
        .sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt))
    : [];

  // Breadcrumb
  const breadcrumbLinks = [
    { label: t("breadcrumb.home"), href: "/" },
    { label: t("breadcrumb.pages") },
    { label: t("breadcrumb.trackOrder"), href: orderData ? "#" : undefined },
    ...(orderData ? [{ label: t("breadcrumb.details") }] : []),
  ].filter((l) => l.label !== t("breadcrumb.trackOrder") || !orderData || l.href);

  return (
    <Wrapper>
      <SEO pageTitle={t("trackOrder.title")} noindex />
      <HeaderClicon />
      <ShopBreadcrumb links={breadcrumbLinks} />

      <section className="cl-track-order">
        <div className="container">
          {/* Form card */}
          <div className="cl-track-order__card">
            <h2 className="cl-track-order__title">{t("trackOrder.title")}</h2>
            <p className="cl-track-order__desc">{t("trackOrder.desc")}</p>

            <form onSubmit={handleSubmit}>
              <div className="cl-track-order__fields">
                <div className="cl-track-order__field">
                  <label className="cl-track-order__label" htmlFor="track-order-id">
                    {t("trackOrder.orderId")}
                  </label>
                  <input
                    id="track-order-id"
                    className="cl-track-order__input"
                    type="text"
                    placeholder={t("trackOrder.orderIdPlaceholder")}
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                  />
                </div>
                <div className="cl-track-order__field">
                  <label className="cl-track-order__label" htmlFor="track-order-email">
                    {t("trackOrder.billingEmail")}
                  </label>
                  <input
                    id="track-order-email"
                    className="cl-track-order__input"
                    type="email"
                    placeholder={t("trackOrder.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="cl-track-order__helper">
                <i className="fa-solid fa-circle-info" />
                {t("trackOrder.helperText")}
              </div>

              {error && <p className="cl-track-order__error">{error}</p>}

              <button
                type="submit"
                className="cl-track-order__btn"
                disabled={isLoading}
              >
                {isLoading ? t("trackOrder.tracking") : t("trackOrder.trackBtn")}
                {!isLoading && <i className="fa-solid fa-arrow-right" />}
              </button>
            </form>
          </div>

          {/* Detail result */}
          {orderData && (
            <div className="cl-track-detail" ref={resultRef}>
              {/* Summary row */}
              <div className="cl-track-detail__summary">
                <div>
                  <h3 className="cl-track-detail__order-id">
                    #{orderData.invoice || orderData.orderNumber}
                  </h3>
                  <p className="cl-track-detail__meta">
                    {orderData.itemCount > 0 && (
                      <>
                        {orderData.itemCount} {t("trackOrder.products")}
                        {" "}&middot;{" "}
                      </>
                    )}
                    {t("trackOrder.orderPlacedIn")}{" "}
                    {dayjs(orderData.createdAt).format("DD MMM, YYYY [at] h:mm A")}
                  </p>
                </div>
                <span className="cl-track-detail__price">
                  {formatPrice(orderData.totalAmount)}
                </span>
              </div>

              {/* Expected arrival */}
              {(orderData.estimatedDelivery || orderData.deliveredAt) && (
                <p className="cl-track-detail__arrival">
                  {orderData.deliveredAt
                    ? <>{t("trackOrder.deliveredOn")} <strong>{dayjs(orderData.deliveredAt).format("DD MMM, YYYY")}</strong></>
                    : <>{t("trackOrder.expectedArrival")} <strong>{dayjs(orderData.estimatedDelivery).format("DD MMM, YYYY")}</strong></>
                  }
                </p>
              )}

              {/* Horizontal progress bar */}
              {orderData.status?.toLowerCase() !== "cancelled" && orderData.status?.toLowerCase() !== "cancel" && (
                <div className="cl-track-detail__progress">
                  <div className="cl-track-detail__progress-track">
                    <div
                      className="cl-track-detail__progress-fill"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {STEP_KEYS.map((step, i) => {
                    let stepState = "pending";
                    if (i < activeStepIndex) stepState = "done";
                    else if (i === activeStepIndex) stepState = "current";

                    return (
                      <div key={step.key} className={`cl-track-detail__step cl-track-detail__step--${stepState}`}>
                        <div className="cl-track-detail__step-circle">
                          {stepState === "done" ? (
                            <i className="fa-solid fa-check" />
                          ) : (
                            <i className={stepState === "current" ? "fa-solid fa-circle" : ""} style={stepState === "current" ? { fontSize: 8 } : {}} />
                          )}
                        </div>
                        <i className={`cl-track-detail__step-icon ${step.icon}`} />
                        <span className="cl-track-detail__step-label">{t(step.i18n)}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Order Activity */}
              {activityEntries.length > 0 && (
                <>
                  <h4 className="cl-track-detail__activity-title">{t("trackOrder.orderActivity")}</h4>
                  <div className="cl-track-detail__activity-list">
                    {activityEntries.map((entry, i) => {
                      const s = (entry.status || "").toLowerCase();
                      const actIcon = ACTIVITY_ICONS[s] || ACTIVITY_ICONS.pending;
                      const i18nKey = ACTIVITY_I18N_KEYS[s];
                      const msg = entry.note || (i18nKey ? t(i18nKey) : t("trackOrder.statusChanged", { status: entry.status }));
                      const time = entry.timestamp || entry.createdAt;

                      return (
                        <div key={i} className="cl-track-detail__activity-item">
                          <div className={`cl-track-detail__activity-icon cl-track-detail__activity-icon${actIcon.cls}`}>
                            <i className={actIcon.icon} />
                          </div>
                          <div className="cl-track-detail__activity-content">
                            <p className="cl-track-detail__activity-text">{msg}</p>
                            <span className="cl-track-detail__activity-time">
                              {dayjs(time).format("DD MMM, YYYY [at] h:mm A")}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      <FooterClicon />
    </Wrapper>
  );
};

export default TrackOrderPage;
