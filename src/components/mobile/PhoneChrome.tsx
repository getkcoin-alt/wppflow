import { createContext, useContext, type ReactNode } from "react";

// What the shell hands to the screens on a phone, so a screen's header can hold the alerts bell and the search without every
// screen being passed them. Outside the app (a test, a screen on its own) there is nothing, and the headers simply leave them out.
export interface PhoneChrome {
  /** the alerts bell, ready to place in a header */
  bell: ReactNode;
  /** open the search / jump palette */
  search: () => void;
}
const PhoneChromeContext = createContext<PhoneChrome | null>(null);
export const PhoneChromeProvider = PhoneChromeContext.Provider;
export const usePhoneChrome = () => useContext(PhoneChromeContext);
