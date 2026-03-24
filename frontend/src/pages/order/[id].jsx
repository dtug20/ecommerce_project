import { useRouter } from "next/router";
import React, { useRef } from "react";
import Image from "next/image";
import dayjs from "dayjs";
import ReactToPrint from "react-to-print";
// internal
import SEO from "@/components/seo";
import Wrapper from "@/layout/wrapper";
import HeaderTwo from "@/layout/headers/header-2";
import Footer from "@/layout/footers/footer";
import logo from "@assets/img/logo/logo.svg";
import ErrorMsg from "@/components/common/error-msg";
import { useGetUserOrderByIdQuery } from "@/redux/features/order/orderApi";
import PrdDetailsLoader from "@/components/loader/prd-details-loader";
import OrderStatusTimeline from "@/components/orders/OrderStatusTimeline";
import OrderTrackingCard from "@/components/orders/OrderTrackingCard";

/**
 * Group cart items by vendor name.
 * Returns a plain object keyed by vendor name with item arrays as values.
 * Items without vendor info are grouped under "Shofy".
 *
 * @param {Array} items
 * @returns {Record<string, Array>}
 */
function groupItemsByVendor(items) {
  if (!items || items.length === 0) return {};
  const groups = {};
  items.forEach((item) => {
    const vendorName =
      item.vendor?.vendorProfile?.storeName || item.vendorName || 'Shofy';
    if (!groups[vendorName]) groups[vendorName] = [];
    groups[vendorName].push(item);
  });
  return groups;
}

/**
 * Render a single cart row — shared by both the flat and grouped layouts.
 */
function OrderItemRow({ item, index }) {
  return (
    <tr>
      <td>{index + 1}</td>
      <td>
        {item.title}
        {item.selectedVariant && (
          <div style={{ fontSize: '11px', color: '#888' }}>
            {item.selectedVariant.color && `Color: ${item.selectedVariant.color}`}
            {item.selectedVariant.size && ` / Size: ${item.selectedVariant.size}`}
          </div>
        )}
      </td>
      <td>{item.orderQuantity}</td>
      <td>${item.price}</td>
      <td>${item.price * item.orderQuantity}</td>
    </tr>
  );
}

const SingleOrder = ({ params }) => {
  const orderId = params.id;
  const printRef = useRef();
  const { data: order, isError, isLoading } = useGetUserOrderByIdQuery(orderId);
  let content = null;

  if (isLoading) {
    content = <PrdDetailsLoader loading={isLoading} />;
  }

  if (isError) {
    content = <ErrorMsg msg="There was an error" />;
  }

  if (!isLoading && !isError && order?.order) {
    const {
      name,
      country,
      city,
      contact,
      invoice,
      createdAt,
      cart,
      shippingCost,
      discount = 0,
      totalAmount,
      paymentMethod,
      status,
      statusHistory,
      trackingNumber,
      carrier,
      trackingUrl,
      estimatedDelivery,
    } = order.order;

    const items = cart || [];
    const vendorGroups = groupItemsByVendor(items);
    const vendorNames = Object.keys(vendorGroups);
    const isMultiVendor = vendorNames.length > 1;

    content = (
      <>
        <section className="invoice__area pt-120 pb-120">
          <div className="container">
            <div className="invoice__msg-wrapper">
              <div className="row">
                <div className="col-xl-12">
                  <div className="invoice_msg mb-40">
                    <p className="text-black alert alert-success">
                      Thank you <strong>{name}</strong> Your order has been received!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Multi-vendor notice */}
            {isMultiVendor && (
              <div className="row mb-20">
                <div className="col-xl-12">
                  <div className="alert alert-info" style={{ fontSize: '13px' }}>
                    Your order contains items from multiple sellers. Each seller will ship
                    their items separately, so you may receive multiple deliveries.
                  </div>
                </div>
              </div>
            )}

            <div className="row mb-40">
              {/* Order Status Timeline */}
              <div className="col-lg-5">
                <OrderStatusTimeline
                  status={status}
                  statusHistory={statusHistory}
                  createdAt={createdAt}
                />

                {/* Tracking Card */}
                <OrderTrackingCard
                  trackingNumber={trackingNumber}
                  carrier={carrier}
                  trackingUrl={trackingUrl}
                  estimatedDelivery={estimatedDelivery}
                />
              </div>

              {/* Invoice */}
              <div className="col-lg-7">
                <div
                  ref={printRef}
                  className="invoice__wrapper grey-bg-2 pt-40 pb-40 pl-40 pr-40 tp-invoice-print-wrapper"
                >
                  <div className="invoice__header-wrapper border-2 border-bottom border-white mb-40">
                    <div className="row">
                      <div className="col-xl-12">
                        <div className="invoice__header pb-20">
                          <div className="row align-items-end">
                            <div className="col-md-4 col-sm-6">
                              <div className="invoice__left">
                                <Image src={logo} alt="logo" />
                                <p>Shofy E-commerce <br /> Ho Chi Minh City, Vietnam</p>
                              </div>
                            </div>
                            <div className="col-md-8 col-sm-6">
                              <div className="invoice__right mt-15 mt-sm-0 text-sm-end">
                                <h3 className="text-uppercase font-70 mb-20">Invoice</h3>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="invoice__customer mb-30">
                    <div className="row">
                      <div className="col-md-6 col-sm-8">
                        <div className="invoice__customer-details">
                          <h4 className="mb-10 text-uppercase">{name}</h4>
                          <p className="mb-0 text-uppercase">{country}</p>
                          <p className="mb-0 text-uppercase">{city}</p>
                          <p className="mb-0">{contact}</p>
                        </div>
                      </div>
                      <div className="col-md-6 col-sm-4">
                        <div className="invoice__details mt-md-0 mt-20 text-md-end">
                          <p className="mb-0">
                            <strong>Invoice ID:</strong> #{invoice}
                          </p>
                          <p className="mb-0">
                            <strong>Date:</strong>{' '}
                            {dayjs(createdAt).format('MMMM D, YYYY')}
                          </p>
                          <p className="mb-0">
                            <strong>Status:</strong>{' '}
                            <span
                              className="badge"
                              style={{
                                backgroundColor:
                                  status === 'delivered'
                                    ? '#16a34a'
                                    : status === 'cancel' || status === 'cancelled'
                                    ? '#dc2626'
                                    : status === 'shipped'
                                    ? '#2563eb'
                                    : '#821F40',
                                fontSize: '11px',
                              }}
                            >
                              {status}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order items — grouped by vendor when multiple vendors present */}
                  <div className="invoice__order-table pt-30 pb-30 pl-40 pr-40 bg-white mb-30">
                    {isMultiVendor ? (
                      vendorNames.map((vendorName) => {
                        const vendorItems = vendorGroups[vendorName];
                        const vendorSubtotal = vendorItems.reduce(
                          (sum, item) =>
                            sum +
                            (item.subtotal ||
                              item.price * (item.quantity || item.orderQuantity || 1)),
                          0
                        );
                        return (
                          <div key={vendorName} className="mb-20">
                            <h6
                              className="mb-10"
                              style={{ fontSize: '13px', color: '#555', fontWeight: 600 }}
                            >
                              Sold by: {vendorName}
                            </h6>
                            <table className="table table-sm mb-5">
                              <thead className="table-light">
                                <tr>
                                  <th scope="col">SL</th>
                                  <th scope="col">Product Name</th>
                                  <th scope="col">Qty</th>
                                  <th scope="col">Price</th>
                                  <th scope="col">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="table-group-divider">
                                {vendorItems.map((item, i) => (
                                  <OrderItemRow key={i} item={item} index={i} />
                                ))}
                              </tbody>
                            </table>
                            <div className="text-end" style={{ fontSize: '12px', color: '#666' }}>
                              Subtotal: ${vendorSubtotal.toFixed(2)}
                            </div>
                            <hr style={{ borderColor: '#eee', margin: '10px 0' }} />
                          </div>
                        );
                      })
                    ) : (
                      <table className="table">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">SL</th>
                            <th scope="col">Product Name</th>
                            <th scope="col">Quantity</th>
                            <th scope="col">Item Price</th>
                            <th scope="col">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="table-group-divider">
                          {items.map((item, i) => (
                            <OrderItemRow key={i} item={item} index={i} />
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="invoice__total pt-40 pb-10 alert-success pl-40 pr-40 mb-30">
                    <div className="row">
                      <div className="col-lg-3 col-md-4">
                        <div className="invoice__payment-method mb-30">
                          <h5 className="mb-0">Payment Method</h5>
                          <p className="tp-font-medium text-uppercase">{paymentMethod}</p>
                        </div>
                      </div>
                      <div className="col-lg-3 col-md-4">
                        <div className="invoice__shippint-cost mb-30">
                          <h5 className="mb-0">Shipping Cost</h5>
                          <p className="tp-font-medium">${shippingCost}</p>
                        </div>
                      </div>
                      <div className="col-lg-3 col-md-4">
                        <div className="invoice__discount-cost mb-30">
                          <h5 className="mb-0">Discount</h5>
                          <p className="tp-font-medium">${discount.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="col-lg-3 col-md-4">
                        <div className="invoice__total-ammount mb-30">
                          <h5 className="mb-0">Total Amount</h5>
                          <p className="tp-font-medium text-danger">
                            <strong>${parseFloat(totalAmount).toFixed(2)}</strong>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="invoice__print text-end mt-3">
              <div className="row">
                <div className="col-xl-12">
                  <ReactToPrint
                    trigger={() => (
                      <button
                        type="button"
                        className="tp-invoice-print tp-btn tp-btn-black"
                      >
                        <span className="mr-5">
                          <i className="fa-regular fa-print"></i>
                        </span>{' '}
                        Print
                      </button>
                    )}
                    content={() => printRef.current}
                    documentTitle="Invoice"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Wrapper>
        <SEO pageTitle={"Order Details"} />
        <HeaderTwo style_2={true} />
        {content}
        <Footer primary_style={true} />
      </Wrapper>
    </>
  );
};

export const getServerSideProps = async ({ params }) => {
  return {
    props: { params },
  };
};

export default SingleOrder;
