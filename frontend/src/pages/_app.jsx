import store from "@/redux/store";
import { Provider } from "react-redux";
import ReactModal from "react-modal";
// import { Elements } from "@stripe/react-stripe-js"; // STRIPE DISABLED
// import { loadStripe } from "@stripe/stripe-js"; // STRIPE DISABLED
import '../styles/index.scss';
import KeycloakProvider from "@/components/providers/keycloak-provider";
if (typeof window !== "undefined") {
  require("bootstrap/dist/js/bootstrap");
}

if (typeof window !== "undefined") {
  ReactModal.setAppElement("body");
}

// stripePromise - STRIPE DISABLED
// const NEXT_PUBLIC_STRIPE_KEY = process.env.NEXT_PUBLIC_STRIPE_KEY;
// const stripePromise = loadStripe(NEXT_PUBLIC_STRIPE_KEY);

export default function App({ Component, pageProps }) {
  return (
    <Provider store={store}>
      <KeycloakProvider>
        {/* STRIPE DISABLED - Elements wrapper removed */}
        <div id="root">
          <Component {...pageProps} />
        </div>
      </KeycloakProvider>
    </Provider>
  )
}
