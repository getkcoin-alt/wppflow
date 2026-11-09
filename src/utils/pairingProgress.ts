// What the pairing screen does once the QR code has been scanned.
//
// The phone then hands the new device its chats, and with a lot of chats that takes minutes. The screen used to give up after three
// minutes, as the server's browser did, which sent people back to scan again, and every scan adds another linked device to the phone.
// So before the scan the screen is patient for three minutes (the browser has to start and show the code); after it, for as long as
// the server is (it gives a number 15 minutes to finish loading its chats).

/** the screen asks the server how the number is doing this often */
export const CHECK_EVERY_MS = 1500;
/** checks before the scan: 180 seconds */
export const GIVE_UP_BEFORE_SCAN = 120;
/** checks after the scan: about 17 minutes */
export const GIVE_UP_AFTER_SCAN = 700;

export const SCANNED_MESSAGE =
  "Scanned. WhatsApp is now loading this number's chats. With a lot of chats this can take several minutes: keep WhatsApp open on your phone, and this screen open.";

export const giveUpAfter = (scanned: boolean): number => (scanned ? GIVE_UP_AFTER_SCAN : GIVE_UP_BEFORE_SCAN);
