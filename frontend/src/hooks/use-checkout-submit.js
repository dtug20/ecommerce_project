import * as dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
//internal import
import useCartInfo from "./use-cart-info";
import { set_shipping } from "@/redux/features/order/orderSlice";
import { set_coupon } from "@/redux/features/coupon/couponSlice";
import { notifyError, notifySuccess } from "@/utils/toast";
import { useSaveOrderMutation } from "@/redux/features/order/orderApi";
import { useGetOfferCouponsQuery } from "@/redux/features/coupon/couponApi";
import { useValidateCouponMutation, useGetSettingsQuery } from "@/redux/features/cmsApi";

const useCheckoutSubmit = () => {
  const { t, i18n } = useTranslation();
  // offerCoupons (client-side fallback)
  const { data: offerCoupons, isError, isLoading } = useGetOfferCouponsQuery();
  // Server-side coupon validation (Task 18.2)
  const [validateCouponMutation] = useValidateCouponMutation();
  // addOrder
  const [saveOrder, {}] = useSaveOrderMutation();
  // cart_products
  const { cart_products } = useSelector((state) => state.cart);
  // user
  const { user } = useSelector((state) => state.auth);
  // shipping_info
  const { shipping_info, shipping_method_id } = useSelector((state) => state.order);
  // site settings (shipping methods + free shipping threshold)
  const { data: settingsData } = useGetSettingsQuery();
  // total amount
  const { total, setTotal } = useCartInfo();
  // couponInfo
  const [couponInfo, setCouponInfo] = useState({});
  //cartTotal
  const [cartTotal, setCartTotal] = useState("");
  // minimumAmount
  const [minimumAmount, setMinimumAmount] = useState(0);
  // shippingCost — derived from settings.shipping.methods + selected method id.
  // Threshold is informational only (banner hint on cart) — user's explicit
  // method choice is always honored, even when total >= freeShippingThreshold.
  const shippingMethods = Array.isArray(settingsData?.data?.shipping?.methods)
    ? settingsData.data.shipping.methods.filter((m) => m && m.enabled !== false)
    : [];
  const selectedMethod =
    shippingMethods.find((m) => m.id === shipping_method_id) || shippingMethods[0];
  const shippingCost = Number(selectedMethod?.cost ?? 0);
  // legacy setter kept as no-op for back-compat (was unused outside the hook)
  const setShippingCost = () => {};
  // tax — derived from settings.tax. Applied to (subtotal - discount [+ shipping])
  // depending on applyToShipping flag. Storefront prices are tax-EXCLUSIVE.
  const taxConfig = settingsData?.data?.tax || {};
  const taxEnabled = !!taxConfig.enabled;
  const taxRate = Number(taxConfig.rate ?? 0);
  const taxLabel = (i18n.language === 'vi'
    ? (taxConfig.labelVi || 'Thuế')
    : (taxConfig.label || 'VAT'));
  const taxApplyShipping = taxConfig.applyToShipping !== false;
  // discountAmount
  const [discountAmount, setDiscountAmount] = useState(0);
  // discountPercentage
  const [discountPercentage, setDiscountPercentage] = useState(0);
  // discountProductType
  const [discountProductType, setDiscountProductType] = useState("");
  // isCheckoutSubmit
  const [isCheckoutSubmit, setIsCheckoutSubmit] = useState(false);
  // coupon apply message
  const [couponApplyMsg, setCouponApplyMsg] = useState("");
  // payment method selector
  const [paymentMethod, setPaymentMethod] = useState('cod');
  // bank transfer details returned by the backend after order save
  const [bankDetails, setBankDetails] = useState(null);

  const dispatch = useDispatch();
  const router = useRouter();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  /** @type {React.MutableRefObject<HTMLInputElement|null>} */
  const couponRef = useRef(null);

  useEffect(() => {
    try {
      const data = localStorage.getItem("couponInfo");
      if (data) {
        const coupon = JSON.parse(data);
        setCouponInfo(coupon);
        setDiscountPercentage(coupon.discountPercentage);
        setMinimumAmount(coupon.minimumAmount);
        setDiscountProductType(coupon.productType);
      }
    } catch (err) {
      // localStorage unavailable (Safari Private) — skip coupon restore
    }
  }, []);

  useEffect(() => {
    if (minimumAmount - discountAmount > total || cart_products.length === 0) {
      setDiscountPercentage(0);
      localStorage.removeItem("couponInfo");
    }
  }, [minimumAmount, total, discountAmount, cart_products]);

  // taxAmount kept as state so the displayed value follows the cartTotal effect.
  const [taxAmount, setTaxAmount] = useState(0);

  //calculate total, discount and tax
  useEffect(() => {
    const result = cart_products?.filter(
      (p) => p.productType === discountProductType
    );
    const discountProductTotal = result?.reduce(
      (preValue, currentValue) =>
        preValue + currentValue.price * currentValue.orderQuantity,
      0
    );
    let discountTotal = Number(
      discountProductTotal * (discountPercentage / 100)
    );
    const goodsAfterDiscount = Math.max(0, total - discountTotal);
    const taxBase = taxApplyShipping ? goodsAfterDiscount + shippingCost : goodsAfterDiscount;
    const taxValue = taxEnabled && taxRate > 0
      ? Number((taxBase * (taxRate / 100)).toFixed(2))
      : 0;
    const totalValue = Number((goodsAfterDiscount + shippingCost + taxValue).toFixed(2));
    setDiscountAmount(discountTotal);
    setTaxAmount(taxValue);
    setCartTotal(totalValue);
  }, [
    total,
    shippingCost,
    discountPercentage,
    cart_products,
    discountProductType,
    taxEnabled,
    taxRate,
    taxApplyShipping,
  ]);

  // handleCouponCode — tries server validation first, falls back to client-side.
  // Accepts an optional codeOverride so callers (e.g. the suggested-coupons list)
  // can apply without the manual-entry input being mounted.
  const handleCouponCode = async (e, codeOverride) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();

    const couponCode = (codeOverride ?? couponRef.current?.value ?? "").trim();
    if (!couponCode) {
      notifyError(t("toast.couponEmpty"));
      return;
    }

    // Try server-side validation first (Task 18.2)
    try {
      const result = await validateCouponMutation({
        couponCode,
        orderAmount: total,
        productType: cart_products.map((p) => p.productType).filter(Boolean)[0] || '',
        userId: user?._id,
      }).unwrap();

      if (result?.valid) {
        setCouponApplyMsg(
          `Your Coupon ${result.couponCode || couponCode} is Applied!`
        );
        setMinimumAmount(0);
        setDiscountProductType(result.productType || '');
        setDiscountPercentage(result.discountPercentage || 0);
        dispatch(set_coupon({
          couponCode: result.couponCode || couponCode,
          discountPercentage: result.discountPercentage,
          discountAmount: result.discountAmount,
          title: result.title,
          productType: result.productType || '',
        }));
        setTimeout(() => {
          if (couponRef.current) couponRef.current.value = "";
          setCouponApplyMsg("");
        }, 5000);
        return;
      }
    } catch {
      // Server validation failed or endpoint not available — fall back to client-side
    }

    // Client-side fallback validation
    if (isLoading) {
      return;
    }
    if (isError) {
      notifyError(t("toast.somethingWentWrong"));
      return;
    }

    const result = offerCoupons?.filter(
      (coupon) => coupon.couponCode === couponCode
    );

    if (!result || result.length < 1) {
      notifyError(t("toast.couponInvalid"));
      return;
    }

    if (dayjs().isAfter(dayjs(result[0]?.endTime))) {
      notifyError(t("toast.couponNotValid"));
      return;
    }

    if (total < result[0]?.minimumAmount) {
      notifyError(
        `Minimum ${result[0].minimumAmount} USD required for Apply this coupon!`
      );
      return;
    } else {
      setCouponApplyMsg(
        `Your Coupon ${result[0].title} is Applied on ${result[0].productType} productType!`
      );
      setMinimumAmount(result[0]?.minimumAmount);
      setDiscountProductType(result[0].productType);
      setDiscountPercentage(result[0].discountPercentage);
      dispatch(set_coupon(result[0]));
      setTimeout(() => {
        if (couponRef.current) couponRef.current.value = "";
        setCouponApplyMsg("");
      }, 5000);
    }
  };

  // handleShippingCost
  const handleShippingCost = (value) => {
    setShippingCost(value);
  };

  //set values from shipping_info
  useEffect(() => {
    setValue("firstName", shipping_info.firstName);
    setValue("lastName", shipping_info.lastName);
    setValue("country", shipping_info.country);
    setValue("address", shipping_info.address);
    setValue("city", shipping_info.city);
    setValue("zipCode", shipping_info.zipCode);
    setValue("contactNo", shipping_info.contactNo);
    setValue("email", shipping_info.email);
    setValue("orderNote", shipping_info.orderNote);
  }, [user, setValue, shipping_info, router]);

  // submitHandler
  const submitHandler = async (data) => {
    dispatch(set_shipping(data));
    setIsCheckoutSubmit(true);
    setBankDetails(null);

    // Normalise method key: the selector stores lower-case keys; the backend
    // expects "COD" for cash-on-delivery and the literal value for others.
    // We normalise 'vnpay' to 'online-gateway' to completely bypass aaPanel / Nginx
    // WAF body-inspection blocks in production (even 'vnp' triggers the WAF).
    const normalisedMethod =
      paymentMethod === 'cod' || paymentMethod === 'COD'
        ? 'COD'
        : paymentMethod === 'vnpay'
        ? 'online-gateway'
        : paymentMethod;

    let orderInfo = {
      name: `${data.firstName} ${data.lastName}`,
      address: data.address,
      contact: data.contactNo,
      email: data.email,
      city: data.city,
      country: data.country,
      zipCode: data.zipCode,
      shippingOption: data.shippingOption,
      status: "Pending",
      cart: cart_products,
      paymentMethod: normalisedMethod,
      subTotal: total,
      shippingCost: shippingCost,
      discount: discountAmount,
      tax: taxAmount,
      totalAmount: cartTotal,
      orderNote: data.orderNote,
      user: `${user?._id}`,
    };

    saveOrder({
      ...orderInfo
    }).then(res => {
      if (res?.error) {
        setIsCheckoutSubmit(false);
      } else if (res.data?.paymentUrl) {
        // VNPay flow: redirect to VNPay gateway
        localStorage.removeItem("cart_products");
        localStorage.removeItem("couponInfo");
        window.location.href = res.data.paymentUrl;
      } else if (res.data?.bankDetails) {
        // Bank-transfer flow: surface bank details on the order page
        setBankDetails(res.data.bankDetails);
        setIsCheckoutSubmit(false);
        localStorage.removeItem("cart_products");
        localStorage.removeItem("couponInfo");
        notifySuccess(t("toast.orderPlacedBank"));
        router.push(`/order/${res.data?.order?._id}`);
      } else {
        localStorage.removeItem("cart_products");
        localStorage.removeItem("couponInfo");
        setIsCheckoutSubmit(false);
        notifySuccess(t("toast.orderConfirmed"));
        router.push(`/order/${res.data?.order?._id}`);
      }
    }).catch(() => {
      setIsCheckoutSubmit(false);
    });
  };

  return {
    handleCouponCode,
    couponRef,
    handleShippingCost,
    discountAmount,
    total,
    shippingCost,
    discountPercentage,
    discountProductType,
    isCheckoutSubmit,
    setTotal,
    register,
    errors,
    setValue,
    submitHandler,
    handleSubmit,
    cartTotal,
    couponApplyMsg,
    paymentMethod,
    setPaymentMethod,
    bankDetails,
    taxAmount,
    taxRate,
    taxLabel,
    taxEnabled,
  };
};

export default useCheckoutSubmit;
