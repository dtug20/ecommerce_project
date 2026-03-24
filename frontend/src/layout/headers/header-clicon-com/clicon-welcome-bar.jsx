import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { setCurrency, selectCurrency } from "@/redux/features/currencySlice";

const CURRENCIES = [
  { code: "USD", label: "USD" },
  { code: "VND", label: "VND" },
];

const CliconWelcomeBar = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const currentCurrency = useSelector(selectCurrency);
  const [activeDrop, setActiveDrop] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentLang = i18n.language?.startsWith("vi") ? "vi" : "en";

  const handleToggle = (key) => {
    setActiveDrop(activeDrop === key ? "" : key);
  };

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
            Welcome to Shofy online eCommerce store.
          </p>
          <div className="cl-welcome-bar__right">
            {/* Social icons */}
            <div className="cl-welcome-bar__socials">
              <span>Follow us:</span>
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
            <div className="cl-welcome-bar__dropdown">
              <button onClick={() => handleToggle("lang")} className="cl-welcome-bar__dropdown-toggle">
                {mounted ? t(`language.${currentLang}`) : "English"}
                <i className="fas fa-chevron-down"></i>
              </button>
              {activeDrop === "lang" && (
                <ul className="cl-welcome-bar__dropdown-menu">
                  <li><a onClick={() => handleChangeLanguage("en")}>English</a></li>
                  <li><a onClick={() => handleChangeLanguage("vi")}>Tiếng Việt</a></li>
                </ul>
              )}
            </div>

            {/* Currency */}
            <div className="cl-welcome-bar__dropdown">
              <button onClick={() => handleToggle("currency")} className="cl-welcome-bar__dropdown-toggle">
                {mounted ? currentCurrency : "USD"}
                <i className="fas fa-chevron-down"></i>
              </button>
              {activeDrop === "currency" && (
                <ul className="cl-welcome-bar__dropdown-menu">
                  {CURRENCIES.map((c) => (
                    <li key={c.code}>
                      <a
                        onClick={() => handleChangeCurrency(c.code)}
                        className={currentCurrency === c.code ? "active" : ""}
                      >
                        {c.label}
                      </a>
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
