// Free WhatsApp OTP: the facts the website states. Keep in step with the backend
// (src/services/otp/config.js and src/services/otp/templates.js) and the app's OTP Studio.

export const OTP_LIMITS = {
  perDay: 100,
  perMonth: 1000,
  perPhoneIn10Min: 3,
  perPhonePerDay: 10,
  testCode: "123456",
  proofMinutes: 10,
};

/** "What is the code for?": the eight ready-made uses. Each sets the wording, digits, expiry, tries and resend wait. */
export const OTP_USES = [
  { key: "login", title: "Sign in", blurb: "Let people log in with a code instead of a password.", digits: 6, expires: "5 minutes", tries: 5, resend: "30 seconds", sample: "*482913* is your Acme sign-in code.\nIt expires in 5 minutes. Never share this code with anyone." },
  { key: "signup", title: "Sign up", blurb: "Check a new account's phone number before it is created.", digits: 6, expires: "10 minutes", tries: 5, resend: "30 seconds", sample: "*482913* is your Acme verification code.\nIt expires in 10 minutes. Never share this code with anyone." },
  { key: "reset", title: "Password reset", blurb: "Prove it is them before choosing a new password.", digits: 6, expires: "10 minutes", tries: 3, resend: "1 minute", sample: "*482913* is your Acme password reset code.\nIt expires in 10 minutes. Never share this code with anyone." },
  { key: "payment", title: "Payment", blurb: "Confirm a payment or a transfer.", digits: 6, expires: "5 minutes", tries: 3, resend: "1 minute", sample: "*482913* is your Acme payment confirmation code.\nIt expires in 5 minutes. Never share this code with anyone." },
  { key: "delivery", title: "Delivery", blurb: "The code a customer gives the courier when the order arrives.", digits: 4, expires: "1 hour", tries: 5, resend: "1 minute", sample: "*4829* is your Acme delivery code.\nGive it to the delivery person only when your order arrives. It expires in 1 hour." },
  { key: "booking", title: "Booking", blurb: "Confirm an appointment, a table or a ticket.", digits: 6, expires: "10 minutes", tries: 5, resend: "30 seconds", sample: "*482913* is your Acme booking confirmation code.\nIt expires in 10 minutes. Never share this code with anyone." },
  { key: "change", title: "Account change", blurb: "Confirm a new phone number, email or address.", digits: 6, expires: "5 minutes", tries: 3, resend: "1 minute", sample: "*482913* is your Acme code to confirm this change.\nIt expires in 5 minutes. Never share this code with anyone." },
  { key: "verify", title: "Verify my number", blurb: "A plain check that the number is theirs.", digits: 6, expires: "5 minutes", tries: 5, resend: "30 seconds", sample: "*482913* is your Acme verification code.\nIt expires in 5 minutes. Never share this code with anyone." },
] as const;

/** The steps in the app's OTP Studio, in the same order. */
export const OTP_STEPS = [
  { title: "Create your free Scriwo account", body: "Sign up with Google or your email. Free OTP works on every plan, including the Free plan." },
  { title: "Choose what the code is for", body: "Open Developers, then Free OTP, and pick one of the eight uses: sign in, sign up, password reset, payment, delivery, booking, account change or verify my number. The message wording, digits, expiry and tries are set for you." },
  { title: "Link the WhatsApp number that sends the codes", body: "Scan one QR code, the same way as WhatsApp Web. Codes are sent from your own number, with your company's name in the message." },
  { title: "Send yourself a test code", body: "Type your own number and see the code arrive on WhatsApp. Or use a test key: it sends nothing and the code is always 123456, so you can build without a phone." },
  { title: "Connect your site", body: "Create a key and paste the code for your language below: two calls from your server, send and verify. No server? Add the ready-made widget to your page instead." },
];

export const OTP_REASONS = [
  { reason: "wrong_code", meaning: "The code typed does not match. The answer includes attemptsLeft." },
  { reason: "expired", meaning: "The code was right but its time ran out. Send a new one." },
  { reason: "too_many_attempts", meaning: "Too many wrong tries; the code is locked. Send a new one." },
  { reason: "already_used", meaning: "This code was already used successfully. Each code works once." },
];

export const OTP_FAQS = [
  { q: "Is Scriwo's WhatsApp OTP really free?", a: `Yes. Every Scriwo account, including the Free plan, can send up to ${OTP_LIMITS.perDay} codes a day and ${OTP_LIMITS.perMonth.toLocaleString("en-US")} a month at no cost. There are no per-message fees, because codes are sent from your own linked WhatsApp number.` },
  { q: "What is the code for?", a: "You choose one of eight uses: sign in, sign up, password reset, payment, delivery, booking, account change or a plain number check. The choice sets the message wording, the number of digits, how long the code works, how many tries are allowed and how long to wait before resending." },
  { q: "Which languages can the OTP message be in?", a: "English, Hindi and Arabic. The wording is fixed so the service cannot be used to send anything other than a code: only your company's name and the code change." },
  { q: "Which programming languages are supported?", a: "Any language that can make an HTTPS request. The page has ready code for Node.js, Python, PHP, Java and cURL, steps for no-code tools such as Zapier, Make and n8n, and a one-script widget for web pages." },
  { q: "Can I test without sending real messages?", a: `Yes. A test key sends nothing and the code is always ${OTP_LIMITS.testCode}, so you can build and test your sign-in flow without a phone.` },
  { q: "How is abuse prevented?", a: `Each phone number can receive at most ${OTP_LIMITS.perPhoneIn10Min} codes in 10 minutes and ${OTP_LIMITS.perPhonePerDay} a day, each code has limited tries and an expiry, codes are stored only as one-way hashes, and the widget only works on the websites you list.` },
  { q: "Is this the official WhatsApp Business API?", a: "No. Scriwo is independent and not affiliated with WhatsApp or Meta. Codes are sent from your own WhatsApp number, linked like WhatsApp Web. For very high volumes of codes, an official API provider may suit you better." },
];
