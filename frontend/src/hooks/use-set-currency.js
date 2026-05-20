// frontend/src/hooks/use-set-currency.js
//
// Single source of truth for changing the user's display currency. Dispatches
// the Redux update for immediate UI response and, when the user is signed in
// via Keycloak, syncs the choice to their server-side preferences so it
// persists across devices.
//
// Returns a stable callback `setCurrency(code)`. Components keep their own
// UI side-effects (closing dropdowns, toggling menus) outside this hook.

import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import keycloak from '@/lib/keycloak';
import { setCurrency as setCurrencyAction } from '@/redux/features/currencySlice';
import { usePatchUserPreferencesMutation } from '@/redux/features/userPreferencesApi';

export default function useSetCurrency() {
  const dispatch = useDispatch();
  const [patchPrefs] = usePatchUserPreferencesMutation();

  return useCallback(async (code) => {
    dispatch(setCurrencyAction(code));
    if (!keycloak.authenticated) return;
    try {
      await patchPrefs({ currency: code }).unwrap();
    } catch {
      // Server sync failure is non-fatal — the Redux update already took
      // effect, and the cookie persists the choice for this device.
    }
  }, [dispatch, patchPrefs]);
}
