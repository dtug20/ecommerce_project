import { useDispatch } from 'react-redux';
import keycloak from '@/lib/keycloak';
import { add_to_wishlist } from '@/redux/features/wishlist-slice';
import { useAddToWishlistMutation, useRemoveFromWishlistMutation } from '@/redux/features/cmsApi';
import { notifyError } from '@/utils/toast';

/**
 * Hook that handles wishlist toggle for both authenticated (server) and
 * anonymous (localStorage) users. Always updates local Redux state, and
 * also calls the API when the user is authenticated.
 */
const useWishlist = () => {
  const dispatch = useDispatch();
  const [addToWishlistMutation] = useAddToWishlistMutation();
  const [removeFromWishlistMutation] = useRemoveFromWishlistMutation();

  const handleWishlistProduct = (product, isCurrentlyInWishlist = false) => {
    // Always update local state (localStorage) for immediate feedback
    dispatch(add_to_wishlist(product));

    // If authenticated, also sync with server
    if (keycloak.authenticated) {
      if (isCurrentlyInWishlist) {
        removeFromWishlistMutation(product._id).catch(() => {
          notifyError('Failed to sync wishlist with server');
        });
      } else {
        addToWishlistMutation(product._id).catch(() => {
          notifyError('Failed to sync wishlist with server');
        });
      }
    }
  };

  return { handleWishlistProduct };
};

export default useWishlist;
