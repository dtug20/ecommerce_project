import { useEffect } from "react";
import { useRouter } from "next/router";
import { useKeycloak } from "@/components/providers/keycloak-provider";
import keycloak from "@/lib/keycloak";
import Loader from "@/components/loader/loader";

const LoginPage = () => {
  const router = useRouter();
  const kc = useKeycloak();

  useEffect(() => {
    // Wait until Keycloak has initialized
    if (!kc?.initialized) return;

    // Validate redirect param to prevent open redirect attacks
    const rawRedirect = router.query.redirect;
    const safeRedirect = (typeof rawRedirect === 'string' && rawRedirect.startsWith('/') && !rawRedirect.includes('://'))
      ? rawRedirect
      : '/';

    if (keycloak.authenticated) {
      router.push(safeRedirect);
    } else {
      keycloak.login({
        redirectUri: window.location.origin + safeRedirect,
      });
    }
  }, [kc?.initialized, router]);

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
