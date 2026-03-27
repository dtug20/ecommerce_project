import React from "react";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import SEO from "@/components/seo";
import Wrapper from "@/layout/wrapper";
import HeaderClicon from "@/layout/headers/header-clicon";
import FooterClicon from "@/layout/footers/footer-clicon";
import ErrorMsg from "@/components/common/error-msg";
import PrdDetailsLoader from "@/components/loader/prd-details-loader";
import ShopBreadcrumb from "@/components/breadcrumb/shop-breadcrumb";
import { useGetUserOrderByIdQuery } from "@/redux/features/order/orderApi";
import useCurrency from "@/hooks/use-currency";
import { OrderStatusStepper } from "@/components/clicon/composites";

// ── Status helpers ───────────────────────────────────────────────────
function getStepIndex(status) {
  const s = (status || "").toLowerCase();
  if (s === "cancel" || s === "cancelled" || s === "canceled") return -1;
  if (s === "delivered") return 3;
  if (s === "shipped" || s === "on the road") return 2;
  if (s === "processing") return 1;
  return 0;
}

// ── Activity icons ───────────────────────────────────────────────────
const ActivityIcon = ({ type }) => {
  const icons = {
    delivered: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    shipped: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
    processing: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      </svg>
    ),
    confirmed: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    canceled: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
    default: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  };
  return icons[type] || icons.default;
};

function getActivityType(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("deliver")) return "delivered";
  if (s.includes("ship") || s.includes("road")) return "shipped";
  if (s.includes("process") || s.includes("pack")) return "processing";
  if (s.includes("confirm") || s.includes("verif")) return "confirmed";
  if (s.includes("cancel")) return "canceled";
  return "default";
}

// ── Step icons ───────────────────────────────────────────────────────
const StepIcon = ({ step, done, active }) => {
  const color = (done || active) ? "#fff" : "#adb5bd";
  const icons = [
    // Order Placed
    <svg key="0" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>,
    // Packaging
    <svg key="1" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    </svg>,
    // On The Road
    <svg key="2" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>,
    // Delivered
    <svg key="3" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>,
  ];
  return icons[step];
};

// ── Main Component ───────────────────────────────────────────────────
const SingleOrder = ({ params }) => {
  const orderId = params.id;
  const router = useRouter();
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const { data: orderData, isError, isLoading } = useGetUserOrderByIdQuery(orderId);

  const breadcrumbLinks = [
    { label: t("breadcrumb.home"), href: "/" },
    { label: t("breadcrumb.userAccount"), href: "/profile" },
    { label: t("trackOrder.dashboard"), href: "/profile?tab=dashboard" },
    { label: t("breadcrumb.orderDetails") },
  ];

  if (isLoading) {
    return (
      <Wrapper>
        <SEO pageTitle="Order Details" noindex />
        <HeaderClicon />
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <PrdDetailsLoader loading />
        </div>
        <FooterClicon />
      </Wrapper>
    );
  }

  if (isError || !orderData?.order) {
    return (
      <Wrapper>
        <SEO pageTitle="Order Details" noindex />
        <HeaderClicon />
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ErrorMsg msg={t("trackOrder.orderNotFound")} />
        </div>
        <FooterClicon />
      </Wrapper>
    );
  }

  const {
    name,
    email,
    contact,
    address,
    country,
    city,
    state,
    zipCode,
    invoice,
    createdAt,
    cart,
    totalAmount,
    status,
    statusHistory = [],
    estimatedDelivery,
    orderNotes,
  } = orderData.order;

  const items = cart || [];
  const stepIndex = getStepIndex(status);
  const isCanceled = stepIndex === -1;
  const stepLabels = [
    t("trackOrder.stepPlaced"),
    t("trackOrder.stepPackaging"),
    t("trackOrder.stepOnTheRoad"),
    t("trackOrder.stepDelivered"),
  ];

  // Build activity list from statusHistory + compute messages
  const activities = [...statusHistory].reverse().map((h) => ({
    status: h.status,
    timestamp: h.changedAt || h.timestamp,
    note: h.note,
  }));
  if (activities.length === 0 && createdAt) {
    activities.push({ status: "pending", timestamp: createdAt });
  }

  const activityMessages = {
    delivered: t("trackOrder.activityDelivered"),
    shipped: t("trackOrder.activityShipped"),
    processing: t("trackOrder.activityProcessing"),
    confirmed: t("trackOrder.activityConfirmed"),
    pending: t("trackOrder.activityPending"),
    canceled: t("trackOrder.activityCancelled"),
  };

  return (
    <Wrapper>
      <SEO pageTitle={`Order #${invoice || orderId.slice(-8)}`} noindex />
      <HeaderClicon />
      <ShopBreadcrumb links={breadcrumbLinks} />

      <section className="cl-order-detail-area">
        <div className="container">
          {/* Header */}
          <div className="cl-od-header">
            <button type="button" className="cl-od-header__back" onClick={() => router.push("/profile?tab=orders")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              {t("trackOrder.orderDetailsTitle")}
            </button>
            <button type="button" className="cl-od-header__rating">
              {t("trackOrder.leaveRating")}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14M5 12l7-7 7 7"/>
              </svg>
            </button>
          </div>

          {/* Order Summary Card */}
          <div className="cl-od-summary">
            <div>
              <div className="cl-od-summary__id">#{invoice || orderId.slice(-8).toUpperCase()}</div>
              <div className="cl-od-summary__meta">
                {items.length} {items.length === 1 ? t("profile.product") : t("profile.products")} &nbsp;·&nbsp; {t("trackOrder.orderPlacedIn")}{" "}
                {dayjs(createdAt).format("D MMM, YYYY [at] h:mm A")}
              </div>
            </div>
            <div className="cl-od-summary__amount">{formatPrice(totalAmount || 0)}</div>
          </div>

          {/* Estimated Arrival */}
          {estimatedDelivery && !isCanceled && (
            <div className="cl-od-arrival">
              {t("trackOrder.expectedArrival")} <strong>{dayjs(estimatedDelivery).format("D MMM, YYYY")}</strong>
            </div>
          )}

          {/* Progress Stepper */}
          <div className="cl-od-card" style={{ marginBottom: 20 }}>
            <div className="cl-od-card__body" style={{ padding: "24px 16px" }}>
              <OrderStatusStepper currentStatus={status} />
            </div>
          </div>

          {/* Order Activity */}
          {activities.length > 0 && (
            <div className="cl-od-card">
              <div className="cl-od-card__title">{t("trackOrder.orderActivity")}</div>
              <div className="cl-od-card__body" style={{ padding: "8px 24px" }}>
                <ul className="cl-od-activity">
                  {activities.map((act, i) => {
                    const type = getActivityType(act.status);
                    return (
                      <li key={i} className="cl-od-activity-item">
                        <div className={`cl-od-activity-item__icon cl-od-activity-item__icon--${type}`}>
                          <ActivityIcon type={type} />
                        </div>
                        <div className="cl-od-activity-item__content">
                          <div className="cl-od-activity-item__text">
                            {act.note || activityMessages[type] || `Order status: ${act.status}`}
                          </div>
                          {act.timestamp && (
                            <div className="cl-od-activity-item__time">
                              {dayjs(act.timestamp).format("D MMM, YYYY [at] h:mm A")}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}

          {/* Products */}
          {items.length > 0 && (
            <div className="cl-od-card">
              <div className="cl-od-card__title">{t("profile.product")} ({String(items.length).padStart(2, "0")})</div>
              <div className="cl-od-card__body" style={{ padding: 0 }}>
                <div style={{ overflowX: "auto" }}>
                  <table className="cl-od-products-table">
                    <thead>
                      <tr>
                        <th style={{ paddingLeft: 24 }}>{t("profile.products")}</th>
                        <th>{t("trackOrder.price")}</th>
                        <th>{t("product.quantity")}</th>
                        <th style={{ paddingRight: 24 }}>{t("trackOrder.subTotal")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, i) => {
                        const imgSrc =
                          (Array.isArray(item.imageURLs) && item.imageURLs[0]?.img) ||
                          item.img ||
                          null;
                        return (
                          <tr key={i}>
                            <td style={{ paddingLeft: 24 }}>
                              <div className="cl-od-product-cell">
                                {imgSrc ? (
                                  <img src={imgSrc} alt={item.title} className="cl-od-product-cell__img" />
                                ) : (
                                  <div className="cl-od-product-cell__img" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.3">
                                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                                    </svg>
                                  </div>
                                )}
                                <div className="cl-od-product-cell__info">
                                  {item.productType && (
                                    <div className="cl-od-product-cell__type">{item.productType}</div>
                                  )}
                                  <div className="cl-od-product-cell__name">{item.title}</div>
                                  {item.selectedVariant && (
                                    <div className="cl-od-product-cell__variant">
                                      {[
                                        item.selectedVariant.color && `Color: ${item.selectedVariant.color}`,
                                        item.selectedVariant.size && `Size: ${item.selectedVariant.size}`,
                                      ].filter(Boolean).join(" / ")}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>{formatPrice(item.price || 0)}</td>
                            <td>x{item.orderQuantity || 1}</td>
                            <td style={{ paddingRight: 24, fontWeight: 600 }}>
                              {formatPrice((item.price || 0) * (item.orderQuantity || 1))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Addresses + Notes */}
          <div className="cl-od-addresses">
            <div className="cl-od-address-card">
              <div className="cl-od-address-card__title">{t("trackOrder.billingAddress")}</div>
              <div className="cl-od-address-card__name">{name}</div>
              {address && <div className="cl-od-address-card__line">{address}</div>}
              {(city || country) && (
                <div className="cl-od-address-card__line">
                  {[city, state, zipCode, country].filter(Boolean).join(", ")}
                </div>
              )}
              {contact && <div className="cl-od-address-card__line">{t("trackOrder.phoneNumber")} {contact}</div>}
              {email && <div className="cl-od-address-card__line">{t("trackOrder.emailLabel")} {email}</div>}
            </div>

            <div className="cl-od-address-card">
              <div className="cl-od-address-card__title">{t("trackOrder.shippingAddress")}</div>
              <div className="cl-od-address-card__name">{name}</div>
              {address && <div className="cl-od-address-card__line">{address}</div>}
              {(city || country) && (
                <div className="cl-od-address-card__line">
                  {[city, state, zipCode, country].filter(Boolean).join(", ")}
                </div>
              )}
              {contact && <div className="cl-od-address-card__line">{t("trackOrder.phoneNumber")} {contact}</div>}
              {email && <div className="cl-od-address-card__line">{t("trackOrder.emailLabel")} {email}</div>}
            </div>

            <div className="cl-od-address-card">
              <div className="cl-od-address-card__title">{t("trackOrder.orderNotes")}</div>
              {orderNotes ? (
                <div className="cl-od-address-card__notes">{orderNotes}</div>
              ) : (
                <div className="cl-od-address-card__notes" style={{ color: "#adb5bd", fontStyle: "italic" }}>
                  {t("trackOrder.noOrderNotes")}
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      <FooterClicon />
    </Wrapper>
  );
};

export async function getServerSideProps({ params }) {
  return { props: { params } };
}

export default SingleOrder;
