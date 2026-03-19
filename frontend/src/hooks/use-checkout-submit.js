import * as dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
//internal import
import useCartInfo from "./use-cart-info";
import { set_shipping } from "@/redux/features/order/orderSlice";
import { set_coupon } from "@/redux/features/coupon/couponSlice";
import { notifyError, notifySuccess } from "@/utils/toast";
import { useSaveOrderMutation } from "@/redux/features/order/orderApi";
import { useGetOfferCouponsQuery } from "@/redux/features/coupon/couponApi";
import { useValidateCouponMutation } from "@/redux/features/cmsApi";

const useCheckoutSubmit = () => {
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
  const { shipping_info } = useSelector((state) => state.order);
  // total amount
  const { total, setTotal } = useCartInfo();
  // couponInfo
  const [couponInfo, setCouponInfo] = useState({});
  //cartTotal
  const [cartTotal, setCartTotal] = useState("");
  // minimumAmount
  const [minimumAmount, setMinimumAmount] = useState(0);
  // shippingCost
  const [shippingCost, setShippingCost] = useState(0);
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

  const dispatch = useDispatch();
  const router = useRouter();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  /** @type {React.MutableRefObject<HTMLInputElement|null>} */
  const couponRef = useRef(null);

  useEffect(() => {
    if (localStorage.getItem("couponInfo")) {
      const data = localStorage.getItem("couponInfo");
      const coupon = JSON.parse(data);
      setCouponInfo(coupon);
      setDiscountPercentage(coupon.discountPercentage);
      setMinimumAmount(coupon.minimumAmount);
      setDiscountProductType(coupon.productType);
    }
  }, []);

  useEffect(() => {
    if (minimumAmount - discountAmount > total || cart_products.length === 0) {
      setDiscountPercentage(0);
      localStorage.removeItem("couponInfo");
    }
  }, [minimumAmount, total, discountAmount, cart_products]);

  //calculate total and discount value
  useEffect(() => {
    const result = cart_products?.filter(
      (p) => p.productType === discountProductType
    );
    const discountProductTotal = result?.reduce(
      (preValue, currentValue) =>
        preValue + currentValue.price * currentValue.orderQuantity,
      0
    );
    let totalValue = "";
    let subTotal = Number((total + shippingCost).toFixed(2));
    let discountTotal = Number(
      discountProductTotal * (discountPercentage / 100)
    );
    totalValue = Number(subTotal - discountTotal);
    setDiscountAmount(discountTotal);
    setCartTotal(totalValue);
  }, [
    total,
    shippingCost,
    discountPercentage,
    cart_products,
    discountProductType,
    discountAmount,
    cartTotal,
  ]);

  // handleCouponCode — tries server validation first, falls back to client-side
  const handleCouponCode = async (e) => {
    e.preventDefault();

    const couponCode = couponRef.current?.value;
    if (!couponCode) {
      notifyError("Please Input a Coupon Code!");
      return;
    }

    // Try server-side validation first (Task 18.2)
    try {
      const result = await validateCouponMutation({
        couponCode,
        total,
        productTypes: cart_products.map((p) => p.productType).filter(Boolean),
      }).unwrap();

      if (result?.valid && result?.coupon) {
        const coupon = result.coupon;
        setCouponApplyMsg(
          `Your Coupon ${coupon.couponCode} is Applied on ${coupon.productType} productType!`
        );
        setMinimumAmount(coupon.minimumAmount || 0);
        setDiscountProductType(coupon.productType || '');
        setDiscountPercentage(coupon.discountPercentage || 0);
        dispatch(set_coupon(coupon));
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
      notifyError("Something went wrong");
      return;
    }

    const result = offerCoupons?.filter(
      (coupon) => coupon.couponCode === couponCode
    );

    if (!result || result.length < 1) {
      notifyError("Please Input a Valid Coupon!");
      return;
    }

    if (dayjs().isAfter(dayjs(result[0]?.endTime))) {
      notifyError("This coupon is not valid!");
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

  // submitHandler — COD only
  const submitHandler = async (data) => {
    dispatch(set_shipping(data));
    setIsCheckoutSubmit(true);

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
      paymentMethod: "COD",
      subTotal: total,
      shippingCost: shippingCost,
      discount: discountAmount,
      totalAmount: cartTotal,
      orderNote: data.orderNote,
      user: `${user?._id}`,
    };

    saveOrder({
      ...orderInfo
    }).then(res => {
      if (res?.error) {
        setIsCheckoutSubmit(false);
      } else {
        localStorage.removeItem("cart_products");
        localStorage.removeItem("couponInfo");
        setIsCheckoutSubmit(false);
        notifySuccess("Your Order Confirmed!");
        router.push(`/order/${res.data?.order?._id}`);
      }
    }).catch(err => {
      console.log(err);
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
  };
};

export default useCheckoutSubmit;
