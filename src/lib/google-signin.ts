import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { GOOGLE_OAUTH } from "../constants";

export function configureGoogleSignin() {
  const webClientId =
    GOOGLE_OAUTH.WEB_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    "";

  GoogleSignin.configure({
    webClientId,
    offlineAccess: false,
    scopes: ["profile", "email"],
  });
}
