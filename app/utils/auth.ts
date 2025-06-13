import { redirect } from "@remix-run/node";
import { cookie, refreshCookie, refreshUserToken } from "~/plugins/directus";

export async function handleTokenRefresh(request: Request) {
  const getCookie = request.headers.get("Cookie");
  const accessToken = await cookie.parse(getCookie);
  const refreshToken = await refreshCookie.parse(getCookie);
  if (!refreshToken) return redirect("/login");
  //   if (!accessToken) {
  try {
    const result = await refreshUserToken(refreshToken);

    console.log("refreshToken", refreshToken);
    if (result?.success) {
      return redirect("/", {
        headers: {
          "Set-Cookie": [
            await cookie.serialize(result?.user?.access_token),
            await refreshCookie.serialize(result?.user?.refresh_token),
          ].join(", "),
        },
      });
    }
  } catch (error) {
    return redirect("/login");
  }
  //   }

  return accessToken;
}
