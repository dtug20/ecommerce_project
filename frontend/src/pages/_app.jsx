import store from "@/redux/store";
import { Provider } from "react-redux";
import ReactModal from "react-modal";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import '../styles/index.scss';
import KeycloakProvider from "@/components/providers/keycloak-provider";
if (typeof window !== "undefined") {
  require("bootstrap/dist/js/bootstrap");
}

if (typeof window !== "undefined") {
  ReactModal.setAppElement("body");
}

// stripePromise
const NEXT_PUBLIC_STRIPE_KEY = process.env.NEXT_PUBLIC_STRIPE_KEY;
const stripePromise = loadStripe(NEXT_PUBLIC_STRIPE_KEY);

export default function App({ Component, pageProps }) {
  return (
    <Provider store={store}>
      <KeycloakProvider>
        <Elements stripe={stripePromise}>
          <div id="root">
            <Component {...pageProps} />
          </div>
        </Elements>
      </KeycloakProvider>
    </Provider>
  )
}
