import React, { useState, useMemo } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { useBrowsingHistory } from "@/hooks/useBrowsingHistory";
import useCurrency from "@/hooks/use-currency";

const BrowsingHistory = () => {
  const { items, isEnabled, removeItem, clear, toggleEnabled } = useBrowsingHistory();
  const { formatPrice } = useCurrency();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchSearch = !search || item.title?.toLowerCase().includes(search.toLowerCase());
      const matchDate = !dateFilter || dayjs(item.date).format("YYYY-MM-DD") === dateFilter;
      return matchSearch && matchDate;
    });
  }, [items, search, dateFilter]);

  // group by date
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((item) => {
      const key = dayjs(item.date).format("D MMM, YYYY").toUpperCase();
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return map;
  }, [filtered]);

  const groupKeys = Object.keys(grouped);

  return (
    <div>
      {/* Header */}
      <div className="cl-browsing__header">
        <h5 className="cl-browsing__title">{t("profile.browsingHistory")}</h5>
        <div className="cl-browsing__toggle-wrap">
          <span>{t("profile.browsingToggle")}</span>
          <label className="cl-toggle">
            <input type="checkbox" checked={isEnabled} onChange={toggleEnabled} />
            <span className="cl-toggle__track">
              <span className="cl-toggle__thumb" />
            </span>
          </label>
        </div>
      </div>

      {/* Filters */}
      <div className="cl-browsing-filters">
        <input
          type="text"
          placeholder={t("profile.searchBrowsingHistory")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="date"
          className="date-input"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
      </div>

      {/* Content */}
      {!isEnabled ? (
        <div className="cl-browsing-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z"/>
            <path d="M4.93 4.93l14.14 14.14"/>
          </svg>
          <p>{t("profile.browsingDisabled")}</p>
        </div>
      ) : groupKeys.length === 0 ? (
        <div className="cl-browsing-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <p>{items.length === 0 ? t("profile.noBrowsingHistory") : t("profile.noSearchResults")}</p>
        </div>
      ) : (
        <>
          {items.length > 0 && (
            <div style={{ textAlign: "right", marginBottom: 8 }}>
              <button
                type="button"
                onClick={clear}
                style={{ fontSize: 12, color: "#dc3545", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                {t("profile.clearAllHistory")}
              </button>
            </div>
          )}
          {groupKeys.map((dateKey) => (
            <div key={dateKey} className="cl-browsing-group">
              <div className="cl-browsing-group__date">{dateKey}</div>
              <div className="cl-browsing-group__grid">
                {grouped[dateKey].map((item) => (
                  <div key={item.id} style={{ position: "relative" }}>
                    <Link href={`/product-details/${item.slug}`} className="cl-browsing-card">
                      <div className="cl-browsing-card__img">
                        {item.image ? (
                          <img src={item.image} alt={item.title} />
                        ) : (
                          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc" }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="cl-browsing-card__info">
                        <h6>{item.title}</h6>
                        <span>{formatPrice(item.price || 0)}</span>
                      </div>
                    </Link>
                    <button
                      type="button"
                      className="cl-browsing-card__remove"
                      onClick={() => removeItem(item.id)}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default BrowsingHistory;
