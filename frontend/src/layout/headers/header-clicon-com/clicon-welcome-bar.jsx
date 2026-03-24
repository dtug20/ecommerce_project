import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const CliconWelcomeBar = () => {
  const { t, i18n } = useTranslation();
  const [activeDrop, setActiveDrop] = useState("");

  const currentLang = i18n.language?.startsWith("vi") ? "vi" : "en";

  const handleToggle = (key) => {
    setActiveDrop(activeDrop === key ? "" : key);
  };

  const handleChangeLanguage = (lng) => {
    i18n.changeLanguage(lng);
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
                {t(`language.${currentLang}`)}
                <i className="fas fa-chevron-down"></i>
              </button>
              {activeDrop === "lang" && (
                <ul className="cl-welcome-bar__dropdown-menu">
                  <li><a onClick={() => handleChangeLanguage("en")}>English</a></li>
                  <li><a onClick={() => handleChangeLanguage("vi")}>Tiếng Việt</a></li>
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
