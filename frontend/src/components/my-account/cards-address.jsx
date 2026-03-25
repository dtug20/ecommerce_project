import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useGetAddressesQuery } from "@/redux/features/cmsApi";

// ── helpers ──────────────────────────────────────────────────────────
const CARDS_KEY = "saved_cards";

function loadCards() {
  try {
    const raw = localStorage.getItem(CARDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCards(cards) {
  try {
    localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
  } catch {}
}

function detectCardType(number) {
  const n = number?.replace(/\s/g, "") || "";
  if (n.startsWith("4")) return "visa";
  if (/^5[1-5]/.test(n) || /^2(2[2-9][1-9]|[3-6]\d{2}|7[01]\d|720)/.test(n)) return "mastercard";
  return "visa";
}

function maskNumber(number) {
  const digits = number?.replace(/\D/g, "") || "";
  if (digits.length < 4) return "•••• •••• •••• " + digits;
  return "•••• •••• •••• " + digits.slice(-4);
}

// ── Payment Card visual ──────────────────────────────────────────────
const PaymentCard = ({ card, onDelete, onEdit }) => {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const cardType = detectCardType(card.number);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div className={`cl-payment-card cl-payment-card--${cardType}`}>
      <div className="cl-payment-card__balance">
        <span style={{ fontSize: 14, opacity: 0.8, marginRight: 4 }}>{t("profile.balance")}</span>
        —
      </div>
      <div className="cl-payment-card__label">{t("profile.cardNumber")}</div>
      <div className="cl-payment-card__number">{maskNumber(card.number)}</div>
      <div className="cl-payment-card__footer">
        <span className="cl-payment-card__brand">
          {cardType === "visa" ? "VISA" : "MASTERCARD"}
        </span>
        <span className="cl-payment-card__holder">{card.name}</span>
      </div>

      {/* context menu */}
      <div ref={menuRef} style={{ position: "absolute", top: 12, right: 12 }}>
        <button
          type="button"
          className="cl-payment-card__menu-btn"
          onClick={() => setMenuOpen((o) => !o)}
        >
          ⋯
        </button>
        {menuOpen && (
          <div className="cl-payment-card__dropdown">
            <button type="button" onClick={() => { setMenuOpen(false); onEdit(card); }}>
              {t("profile.editCard")}
            </button>
            <button type="button" className="delete" onClick={() => { setMenuOpen(false); onDelete(card.id); }}>
              {t("profile.deleteCard")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Add / Edit Card Modal ────────────────────────────────────────────
const CardModal = ({ initial, onSave, onClose }) => {
  const { t } = useTranslation();
  const [name, setName] = useState(initial?.name || "");
  const [number, setNumber] = useState(initial?.number || "");
  const [expiry, setExpiry] = useState(initial?.expiry || "");
  const [cvc, setCvc] = useState(initial?.cvc || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !number) return;
    // Only store last 4 digits — never persist full card number or CVC
    const last4 = number.replace(/\D/g, "").slice(-4);
    onSave({ id: initial?.id || Date.now().toString(), name, number: last4, expiry });
  };

  return (
    <div className="cl-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cl-modal">
        <div className="cl-modal__title">{initial ? t("profile.editCard") : t("profile.addNewCard")}</div>
        <button type="button" className="cl-modal__close" onClick={onClose}>×</button>
        <form onSubmit={handleSubmit}>
          <div className="cl-setting-field">
            <label>{t("profile.nameOnCard")}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("profile.nameOnCard")} required />
          </div>
          <div className="cl-setting-field">
            <label>{t("profile.cardNumber")}</label>
            <input
              value={number}
              onChange={(e) => setNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
              placeholder="1234 5678 9012 3456"
              required
            />
          </div>
          <div className="row g-3">
            <div className="col-6">
              <div className="cl-setting-field">
                <label>{t("profile.expireDate")}</label>
                <input
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  placeholder="MM/YY"
                />
              </div>
            </div>
            <div className="col-6">
              <div className="cl-setting-field">
                <label>{t("profile.cvc")}</label>
                <input
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="•••"
                />
              </div>
            </div>
          </div>
          <button type="submit" className="cl-setting-save-btn" style={{ width: "100%" }}>
            {initial ? t("profile.saveChanges") : t("profile.addCard")}
          </button>
        </form>
      </div>
    </div>
  );
};

// ── Address display card ─────────────────────────────────────────────
const AddressDisplayCard = ({ title, address, onEdit }) => {
  const { t } = useTranslation();
  return (
    <div className="cl-address-card">
      <div className="cl-address-card__header">
        <div className="cl-address-card__title">{title}</div>
        <button type="button" className="cl-address-card__edit-btn" onClick={onEdit}>
          {t("profile.editAddress")}
        </button>
      </div>
      {address ? (
        <>
          <div className="cl-address-card__name">{address.fullName}</div>
          {address.address && <div className="cl-address-card__text">{address.address}</div>}
          {(address.city || address.country) && (
            <div className="cl-address-card__text">
              {[address.city, address.state, address.zipCode, address.country].filter(Boolean).join(", ")}
            </div>
          )}
          {address.phone && <div className="cl-address-card__text">{t("trackOrder.phoneNumber")} {address.phone}</div>}
          {address.email && <div className="cl-address-card__text">{t("trackOrder.emailLabel")} {address.email}</div>}
        </>
      ) : (
        <div className="cl-address-card__empty">{t("profile.noAddressSaved")}</div>
      )}
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────
const CardsAddress = ({ setActiveTab }) => {
  const { user } = useSelector((state) => state.auth);
  const { t } = useTranslation();
  const { data: addressData } = useGetAddressesQuery(undefined, { skip: !user });

  const [cards, setCards] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);

  useEffect(() => {
    setCards(loadCards());
  }, []);

  const handleSaveCard = (card) => {
    const updated = editingCard
      ? cards.map((c) => (c.id === card.id ? card : c))
      : [...cards, card];
    setCards(updated);
    saveCards(updated);
    setShowModal(false);
    setEditingCard(null);
  };

  const handleDeleteCard = (id) => {
    const updated = cards.filter((c) => c.id !== id);
    setCards(updated);
    saveCards(updated);
  };

  const handleEdit = (card) => {
    setEditingCard(card);
    setShowModal(true);
  };

  const addresses = addressData?.addresses || [];
  const billingAddr = addresses.find((a) => a.isDefault) || addresses[0];
  const shippingAddr = addresses[1] || null;

  return (
    <>
      {/* Payment Option */}
      <div className="cl-cards-section">
        <div className="cl-cards-section__header">
          <div className="cl-cards-section__title">{t("profile.paymentOption")}</div>
          <button
            type="button"
            className="cl-cards-section__add-btn"
            onClick={() => { setEditingCard(null); setShowModal(true); }}
          >
            {t("profile.addCard")}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        {cards.length === 0 ? (
          <p style={{ fontSize: 13, color: "#687188", marginBottom: 24 }}>
            {t("profile.noCards")}
          </p>
        ) : (
          <div className="cl-cards-grid">
            {cards.map((card) => (
              <PaymentCard
                key={card.id}
                card={card}
                onDelete={handleDeleteCard}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>

      {/* Addresses */}
      <div style={{ marginBottom: 20 }}>
        <AddressDisplayCard
          title={t("profile.billingAddress")}
          address={billingAddr}
          onEdit={() => setActiveTab("setting")}
        />
        <AddressDisplayCard
          title={t("trackOrder.shippingAddress")}
          address={shippingAddr}
          onEdit={() => setActiveTab("setting")}
        />
      </div>

      {/* Modal */}
      {showModal && (
        <CardModal
          initial={editingCard}
          onSave={handleSaveCard}
          onClose={() => { setShowModal(false); setEditingCard(null); }}
        />
      )}
    </>
  );
};

export default CardsAddress;
