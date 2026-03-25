import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { setCurrency, selectCurrency } from "@/redux/features/currencySlice";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
];

const CURRENCIES = [
  { code: "USD", label: "Dollar (USD)" },
  { code: "VND", label: "Đồng (VND)" },
];

const CliconWelcomeBar = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const currentCurrency = useSelector(selectCurrency);
  const [activeDrop, setActiveDrop] = useState("");
  const [mounted, setMounted] = useState(false);
  const langRef = useRef(null);
  const currRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        langRef.current && !langRef.current.contains(e.target) &&
        currRef.current && !currRef.current.contains(e.target)
      ) {
        setActiveDrop("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLang = i18n.language?.startsWith("vi") ? "vi" : "en";
  const currentLangObj = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  const handleToggle = (key) => setActiveDrop(activeDrop === key ? "" : key);

  const handleChangeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setActiveDrop("");
  };

  const handleChangeCurrency = (code) => {
    dispatch(setCurrency(code));
    setActiveDrop("");
  };

  return (
    <div className="cl-welcome-bar">
      <div className="container">
        <div className="cl-welcome-bar__inner">
          <p className="cl-welcome-bar__text">
            {t("header.freeShipping")}
          </p>
          <div className="cl-welcome-bar__right">
            {/* Social icons */}
            <div className="cl-welcome-bar__socials">
              <span>{t("common.followUs", "Follow us:")}</span>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="https://pinterest.com" target="_blank" rel="noreferrer" aria-label="Pinterest">
                <i className="fab fa-pinterest-p"></i>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube">
                <i className="fab fa-youtube"></i>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                <i className="fab fa-instagram"></i>
              </a>
            </div>

            {/* Language */}
            <div className="cl-welcome-bar__dropdown" ref={langRef}>
              <button
                onClick={() => handleToggle("lang")}
                className={`cl-welcome-bar__dropdown-toggle${activeDrop === "lang" ? " cl-welcome-bar__dropdown-toggle--open" : ""}`}
              >
                <span className="cl-welcome-bar__flag">{mounted ? currentLangObj.flag : "🇺🇸"}</span>
                <span>{mounted ? currentLangObj.label : "English"}</span>
                <i className="fas fa-chevron-down cl-welcome-bar__chevron"></i>
              </button>
              {activeDrop === "lang" && (
                <ul className="cl-welcome-bar__dropdown-menu">
                  {LANGUAGES.map((lang) => (
                    <li key={lang.code}>
                      <button
                        className={`cl-welcome-bar__dropdown-item${currentLang === lang.code ? " cl-welcome-bar__dropdown-item--active" : ""}`}
                        onClick={() => handleChangeLanguage(lang.code)}
                      >
                        <span className="cl-welcome-bar__flag">{lang.flag}</span>
                        <span>{lang.label}</span>
                        {currentLang === lang.code && (
                          <svg className="cl-welcome-bar__check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Currency */}
            <div className="cl-welcome-bar__dropdown" ref={currRef}>
              <button
                onClick={() => handleToggle("currency")}
                className={`cl-welcome-bar__dropdown-toggle${activeDrop === "currency" ? " cl-welcome-bar__dropdown-toggle--open" : ""}`}
              >
                <span>{mounted ? currentCurrency : "USD"}</span>
                <i className="fas fa-chevron-down cl-welcome-bar__chevron"></i>
              </button>
              {activeDrop === "currency" && (
                <ul className="cl-welcome-bar__dropdown-menu">
                  {CURRENCIES.map((c) => (
                    <li key={c.code}>
                      <button
                        className={`cl-welcome-bar__dropdown-item${currentCurrency === c.code ? " cl-welcome-bar__dropdown-item--active" : ""}`}
                        onClick={() => handleChangeCurrency(c.code)}
                      >
                        <span>{c.label}</span>
                        {currentCurrency === c.code && (
                          <svg className="cl-welcome-bar__check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CliconWelcomeBar;
