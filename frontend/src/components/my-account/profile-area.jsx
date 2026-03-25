import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import ProfileNavTab from "./profile-nav-tab";
import ProfileDashboard from "./profile-dashboard";
import OrderHistory from "./order-history";
import AccountSetting from "./account-setting";
import CardsAddress from "./cards-address";
import BrowsingHistory from "./browsing-history";

const VALID_TABS = ["dashboard", "orders", "cards", "browsing", "setting"];

const ProfileArea = ({ orderData }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");

  // sync tab from URL ?tab= param
  useEffect(() => {
    const tabParam = router.query.tab;
    if (tabParam && VALID_TABS.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [router.query.tab]);

  // update URL when tab changes (shallow routing)
  const handleSetActiveTab = (tab) => {
    setActiveTab(tab);
    router.replace({ pathname: router.pathname, query: { tab } }, undefined, { shallow: true });
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <ProfileDashboard orderData={orderData} setActiveTab={handleSetActiveTab} />;
      case "orders":
        return <OrderHistory orderData={orderData} />;
      case "cards":
        return <CardsAddress setActiveTab={handleSetActiveTab} />;
      case "browsing":
        return <BrowsingHistory />;
      case "setting":
        return <AccountSetting />;
      default:
        return <ProfileDashboard orderData={orderData} setActiveTab={handleSetActiveTab} />;
    }
  };

  return (
    <section className="cl-profile-wrap">
      <div className="container">
        <div className="row">
          <div className="col-xxl-3 col-lg-3 col-md-4">
            <ProfileNavTab activeTab={activeTab} setActiveTab={handleSetActiveTab} />
          </div>
          <div className="col-xxl-9 col-lg-9 col-md-8">
            <div className="cl-profile-content">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfileArea;
