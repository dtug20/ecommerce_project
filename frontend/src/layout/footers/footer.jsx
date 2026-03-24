import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
// internal
import logo from '@assets/img/logo/logo.svg';
import pay from '@assets/img/footer/footer-pay.png';
import social_data from '@/data/social-data';
import { Email, Location } from '@/svg';
import { useGetSettingsQuery } from '@/redux/features/cmsApi';

const Footer = ({ style_2 = false, style_3 = false, primary_style = false }) => {
  const { t } = useTranslation();
  const { data: settingsData } = useGetSettingsQuery();
  const siteSettings = settingsData?.data;

  // Contact info — prefer CMS settings, fall back to hardcoded values
  const phone = siteSettings?.contact?.phone || '+01622064136';
  const email = siteSettings?.contact?.email || 'shuvoprogramer@gmail.com';
  const address = siteSettings?.contact?.address || 'Savar, Dhaka, Bangladesh';

  // Social links — prefer CMS settings, fall back to static data
  const socialLinks = siteSettings?.contact?.socialLinks;
  const hasDynamicSocial = socialLinks && Object.keys(socialLinks).length > 0;

  return (
    <footer>
      <div
        className={`tp-footer-area ${
          primary_style
            ? 'tp-footer-style-2 tp-footer-style-primary tp-footer-style-6'
            : ''
        } ${
          style_2 ? 'tp-footer-style-2' : style_3 ? 'tp-footer-style-2 tp-footer-style-3' : ''
        }`}
        data-bg-color={`${style_2 ? 'footer-bg-white' : 'footer-bg-grey'}`}
      >
        <div className="tp-footer-top pt-95 pb-40">
          <div className="container">
            <div className="row">
              <div className="col-xl-4 col-lg-3 col-md-4 col-sm-6">
                <div className="tp-footer-widget footer-col-1 mb-50">
                  <div className="tp-footer-widget-content">
                    <div className="tp-footer-logo">
                      <Link href="/">
                        <Image src={logo} alt="logo" />
                      </Link>
                    </div>
                    <p className="tp-footer-desc">{t('footer.description')}</p>
                    <div className="tp-footer-social">
                      {hasDynamicSocial ? (
                        Object.entries(socialLinks).map(([platform, url]) =>
                          url ? (
                            <a
                              key={platform}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <i className={`fa-brands fa-${platform}`}></i>
                            </a>
                          ) : null
                        )
                      ) : (
                        social_data.map((s) => (
                          <a href={s.link} key={s.id} target="_blank" rel="noreferrer">
                            <i className={s.icon}></i>
                          </a>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-2 col-lg-3 col-md-4 col-sm-6">
                <div className="tp-footer-widget footer-col-2 mb-50">
                  <h4 className="tp-footer-widget-title">{t('footer.myAccount')}</h4>
                  <div className="tp-footer-widget-content">
                    <ul>
                      <li><Link href="/profile">{t('footer.trackOrders')}</Link></li>
                      <li><Link href="/shop">{t('footer.shipping')}</Link></li>
                      <li><Link href="/wishlist">{t('footer.wishlist')}</Link></li>
                      <li><Link href="/profile">{t('footer.myAccount')}</Link></li>
                      <li><Link href="/profile">{t('footer.orderHistory')}</Link></li>
                      <li><Link href="/contact">{t('footer.returns')}</Link></li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-3 col-md-4 col-sm-6">
                <div className="tp-footer-widget footer-col-3 mb-50">
                  <h4 className="tp-footer-widget-title">{t('footer.information')}</h4>
                  <div className="tp-footer-widget-content">
                    <ul>
                      <li><Link href="/contact">{t('footer.ourStory')}</Link></li>
                      <li><Link href="/contact">{t('footer.careers')}</Link></li>
                      <li><Link href="/contact">{t('footer.privacyPolicy')}</Link></li>
                      <li><Link href="/contact">{t('footer.termsConditions')}</Link></li>
                      <li><Link href="/blog">{t('footer.latestNews')}</Link></li>
                      <li><Link href="/contact">{t('footer.contactUs')}</Link></li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-3 col-md-4 col-sm-6">
                <div className="tp-footer-widget footer-col-4 mb-50">
                  <h4 className="tp-footer-widget-title">{t('footer.talkToUs')}</h4>
                  <div className="tp-footer-widget-content">
                    <div className="tp-footer-talk mb-20">
                      <span>{t('footer.gotQuestions')}</span>
                      <h4>
                        <a href={`tel:${phone.replace(/\s/g, '')}`}>{phone}</a>
                      </h4>
                    </div>
                    <div className="tp-footer-contact">
                      <div className="tp-footer-contact-item d-flex align-items-start">
                        <div className="tp-footer-contact-icon">
                          <span>
                            <Email />
                          </span>
                        </div>
                        <div className="tp-footer-contact-content">
                          <p>
                            <a href={`mailto:${email}`}>{email}</a>
                          </p>
                        </div>
                      </div>
                      <div className="tp-footer-contact-item d-flex align-items-start">
                        <div className="tp-footer-contact-icon">
                          <span>
                            <Location />
                          </span>
                        </div>
                        <div className="tp-footer-contact-content">
                          <p>{address}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="tp-footer-bottom">
          <div className="container">
            <div className="tp-footer-bottom-wrapper">
              <div className="row align-items-center">
                <div className="col-md-6">
                  <div className="tp-footer-copyright">
                    <p>
                      &copy; {new Date().getFullYear()} Shofy. {t('footer.allRightsReserved')}
                    </p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="tp-footer-payment text-md-end">
                    <p>
                      <Image src={pay} alt="pay" />
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
