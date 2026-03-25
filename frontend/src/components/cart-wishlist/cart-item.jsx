import React from "react";
import Image from "next/image";
import { useDispatch } from "react-redux";
import Link from "next/link";
// internal
import { Close, Minus, Plus } from "@/svg";
import { add_cart_product, quantityDecrement, remove_product, setCartItemQuantity } from "@/redux/features/cartSlice";

const CartItem = ({product}) => {
  const {_id, img,title,price, orderQuantity = 0 } = product || {};

  const dispatch = useDispatch();

    // handle add product
    const handleAddProduct = (prd) => {
      dispatch(add_cart_product(prd))
    }
    // handle decrement product
    const handleDecrement = (prd) => {
      dispatch(quantityDecrement(prd))
    }
  
    // handle remove product
    const handleRemovePrd = (prd) => {
      dispatch(remove_product(prd))
    }

    const handleQuantityChange = (e) => {
      dispatch(setCartItemQuantity({
        _id: product._id,
        quantity: e.target.value,
        maxStock: product.quantity // The maximum variant stock bound to this item
      }));
    };

  return (
    <tr>
      {/* img */}
      <td className="tp-cart-img">
        <Link href={`/product-details/${_id}`}>
          {img ? <Image src={img} alt={title || "product"} width={70} height={100} /> : <div style={{width:70,height:100,backgroundColor:'var(--tp-gray-100)'}} />}
        </Link>
      </td>
      {/* title */}
      <td className="tp-cart-title">
        <Link href={`/product-details/${_id}`}>{title}</Link>
      </td>
      {/* price */}
      <td className="tp-cart-price">
        <span>${(price * orderQuantity).toFixed(2)}</span>
      </td>
      {/* quantity */}
      <td className="tp-cart-quantity">
        <div className="tp-product-quantity mt-10 mb-10">
          <span onClick={()=> handleDecrement(product)} className="tp-cart-minus" role="button" aria-label="Decrease quantity">
            <Minus />
          </span>
          <input 
            className="tp-cart-input" 
            type="text" 
            value={orderQuantity} 
            onChange={handleQuantityChange}
            aria-label="Product quantity" 
          />
          <span onClick={()=> handleAddProduct(product)} className="tp-cart-plus" role="button" aria-label="Increase quantity">
            <Plus />
          </span>
        </div>
      </td>
      {/* action */}
      <td className="tp-cart-action">
        <button onClick={()=> handleRemovePrd({title,id:_id})} className="tp-cart-action-btn" aria-label={`Remove ${title}`}>
          <Close />
          <span>{" "}Remove</span>
        </button>
      </td>
    </tr>
  );
};

export default CartItem;
