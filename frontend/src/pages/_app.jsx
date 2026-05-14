import store from "@/redux/store";
import { Provider } from "react-redux";
import ReactModal from "react-modal";
import '../styles/index.scss';
import KeycloakProvider from "@/components/providers/keycloak-provider";
if (typeof window !== "undefined") {
  require("bootstrap/dist/js/bootstrap");
}

if (typeof window !== "undefined") {
  ReactModal.setAppElement("body");
}

export default function App({ Component, pageProps }) {
  return (
    <Provider store={store}>
      <KeycloakProvider>
        <div id="root">
          <Component {...pageProps} />
        </div>
      </KeycloakProvider>
    </Provider>
  )
}
