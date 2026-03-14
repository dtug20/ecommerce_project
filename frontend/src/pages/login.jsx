import { useEffect } from "react";
import { useRouter } from "next/router";
import keycloak from "@/lib/keycloak";
import Loader from "@/components/loader/loader";

const LoginPage = () => {
  const router = useRouter();

  useEffect(() => {
    if (keycloak.authenticated) {
      router.push(router.query.redirect || "/");
    } else {
      keycloak.login({
        redirectUri: window.location.origin + (router.query.redirect || "/"),
      });
    }
  }, [router]);

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ height: "100vh" }}
    >
      <Loader spinner="fade" loading={true} />
    </div>
  );
};

export default LoginPage;
