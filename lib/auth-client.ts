import { createAuthClient } from "better-auth/client";
import { twoFactorClient } from "better-auth/client/plugins";

const getBaseURL = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3462";
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [
    twoFactorClient({
      twoFactorPage: "/admin/verify-2fa",
    }),
  ],
});
