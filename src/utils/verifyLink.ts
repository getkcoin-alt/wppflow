/** The token in a confirmation link (/?verify=<token>), if this visit came from one */
export const verifyTokenFromUrl = () => {
  try {
    return new URLSearchParams(window.location.search).get("verify") || "";
  } catch {
    return "";
  }
};
