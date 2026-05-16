import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { add_cart_product } from '@/redux/features/cartSlice';

export default function SuggestedActionCard({ action }) {
  const { t } = useTranslation('common');
  const dispatch = useDispatch();
  const router = useRouter();

  if (!action) return null;

  const handle = () => {
    switch (action.type) {
      case 'add_to_cart': {
        const p = action.payload || {};
        dispatch(
          add_cart_product({
            _id: p.productId,
            title: p.title,
            price: p.price,
            orderQuantity: p.qty || 1,
            slug: p.slug,
            img: p.image,
          })
        );
        toast.success(
          `${p.title || t('chat.actionAddToCart')} — ${t('cart.added', { defaultValue: 'added to cart' })}`
        );
        break;
      }
      case 'apply_coupon': {
        const p = action.payload || {};
        if (typeof window !== 'undefined') {
          localStorage.setItem('couponInfo', JSON.stringify({ code: p.code }));
        }
        toast.success(`${t('chat.actionApplyCoupon')}: ${p.code}`);
        break;
      }
      case 'view_product': {
        const p = action.payload || {};
        router.push(`/product-details/${p.slug || p.productId}`);
        break;
      }
      case 'view_order': {
        const p = action.payload || {};
        router.push(`/order/${p.orderId}`);
        break;
      }
      case 'sign_in':
        router.push('/login');
        break;
      default:
        break;
    }
  };

  return (
    <div className="shofy-chat__action-card">
      {action.description && (
        <div className="shofy-chat__action-card-label">{action.description}</div>
      )}
      <button type="button" onClick={handle}>
        {action.label || t(`chat.action${capitalize(action.type)}`, { defaultValue: action.type })}
      </button>
    </div>
  );
}

function capitalize(s) {
  if (!s) return '';
  return s
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}
