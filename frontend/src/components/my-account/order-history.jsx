import React, { useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import useCurrency from "@/hooks/use-currency";

const PAGE_SIZE = 10;

function getStatusClass(status) {
  const s = status?.toLowerCase();
  if (s === "pending") return "cl-order-status--progress";
  if (s === "processing") return "cl-order-status--processing";
  if (s === "delivered") return "cl-order-status--completed";
  if (s === "cancel" || s === "cancelled" || s === "canceled") return "cl-order-status--canceled";
  return "cl-order-status--progress";
}

const OrderHistory = ({ orderData }) => {
  const { formatPrice } = useCurrency();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  function getStatusLabel(status) {
    const s = status?.toLowerCase();
    if (s === "pending") return t("profile.inProgress");
    if (s === "processing") return t("profile.processing");
    if (s === "delivered") return t("profile.completed");
    if (s === "cancel" || s === "cancelled" || s === "canceled") return t("profile.canceled");
    return status;
  }
  const orders = orderData?.orders || [];

  const totalPages = Math.ceil(orders.length / PAGE_SIZE);
  const pageOrders = orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (orders.length === 0) {
    return (
      <div className="cl-order-history">
        <div className="cl-order-history__title">{t("profile.orderHistoryTitle")}</div>
        <div className="cl-order-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <p>{t("profile.noOrders")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cl-order-history">
      <div className="cl-order-history__title">{t("profile.orderHistoryTitle")}</div>

      <div style={{ overflowX: "auto" }}>
        <table className="cl-order-table">
          <thead>
            <tr>
              <th>{t("profile.orderId")}</th>
              <th>{t("profile.status")}</th>
              <th>{t("profile.date")}</th>
              <th>{t("profile.total")}</th>
              <th>{t("profile.action")}</th>
            </tr>
          </thead>
          <tbody>
            {pageOrders.map((order) => {
              const itemCount = (order.cart || []).length;
              const total = formatPrice(order.totalAmount || 0);
              return (
                <tr key={order._id}>
                  <td style={{ fontWeight: 600 }}>#{order._id.slice(-8).toUpperCase()}</td>
                  <td>
                    <span className={`cl-order-status ${getStatusClass(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td style={{ color: "#687188", whiteSpace: "nowrap" }}>
                    {dayjs(order.createdAt).format("MMM D, YYYY HH:mm")}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {total}
                    {itemCount > 0 && (
                      <span style={{ color: "#687188", fontSize: 12, marginLeft: 4 }}>
                        ({itemCount} {itemCount === 1 ? t("profile.product") : t("profile.products")})
                      </span>
                    )}
                  </td>
                  <td>
                    <Link href={`/order/${order._id}`} className="cl-order-action-link">
                      {t("profile.viewDetails")}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="cl-pagination">
          <button
            type="button"
            className="cl-pagination__btn cl-pagination__btn--nav"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              className={`cl-pagination__btn${p === page ? " cl-pagination__btn--active" : ""}`}
              onClick={() => setPage(p)}
            >
              {String(p).padStart(2, "0")}
            </button>
          ))}
          <button
            type="button"
            className="cl-pagination__btn cl-pagination__btn--nav"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
