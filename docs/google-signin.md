# Google sign-in: what it is and how to switch it on

"Continue with Google" appears on the sign-in and sign-up pages of the app (`https://app.scriwo.com`) and of each industry
address (`https://homes.scriwo.com`) once the server knows Google's client id and secret. Without them the button is hidden
everywhere and nothing else changes.

## Google Cloud settings

Client type **Web application**.

- Authorised JavaScript origins: `https://www.scriwo.com`, `https://scriwo.com`, `https://app.scriwo.com`, `https://homes.scriwo.com`
- Authorised redirect URIs: `https://app.scriwo.com/api/auth/google/callback` and `https://homes.scriwo.com/api/auth/google/callback`

A sign-in comes back to the address it started on, because the cookies that tie the return to the start (and, afterwards, the
person's signed-in session) belong to that address only. So **every address that has a "Continue with Google" button needs its own
redirect URI**: the app, and each industry address (homes.). The button is offered on all of them, so an industry's address must have
its two entries saved **before that address is launched**. Until it is, Google answers the person with "Access blocked: This app's
request is invalid" (detail: "Error 400: redirect_uri_mismatch"); the other addresses are not affected. A new industry address
`x.scriwo.com` needs `https://x.scriwo.com` as an origin and `https://x.scriwo.com/api/auth/google/callback` as a redirect URI, and a
vertical of that name on the server. The server only accepts its own addresses (the app's and the industries'), so nothing a person
types can send them or Google anywhere else.

To check an address before launch: open its sign-in page, press "Continue with Google". Google's account chooser means the entries are
in place; "Access blocked" means they are not saved yet (or Google is still applying them).

To add one: Google Cloud console, the project that owns the client (APIs & Services, Credentials), open the web client, **Add URI**
under both lists, **Save**. Google says it can take a few minutes, sometimes longer, to apply. The client id and secret do not change,
and the server needs no new settings.

## Put the two secrets on the server

Run on the server, as the user that owns the app. The secret is typed at a hidden prompt, so it never appears on screen or in
shell history. Run it again to change the values.

```bash
cd /opt/wppflow-backend
cp .env ".env.bak.$(date +%F-%H%M)"

read -rp  "Google Client ID: " GID
read -rsp "Google Client secret: " GSEC; echo

[ -n "$(tail -c1 .env)" ] && echo >> .env          # make sure the file ends with a newline
sed -i '/^GOOGLE_CLIENT_ID=/d;/^GOOGLE_CLIENT_SECRET=/d' .env
printf 'GOOGLE_CLIENT_ID=%s\nGOOGLE_CLIENT_SECRET=%s\n' "$GID" "$GSEC" >> .env
unset GID GSEC
chmod 600 .env

pm2 restart wppflow-backend-v3 --update-env
sleep 3
curl -s https://app.scriwo.com/api/auth/providers      # expect: {"status":"success","google":true}
```

If it says `"google":false`, the server did not pick the values up: check `grep -c '^GOOGLE_' .env` prints `2`, and that
the name `wppflow-backend-v3` matches `pm2 ls`. To undo: `cp .env.bak.<the date printed by ls> .env && pm2 restart wppflow-backend-v3 --update-env`.

The website and the app on Vercel need **no** settings for this: the secret lives only on the server.

## What it does

1. The button goes to `/api/auth/google/start` (with the address the person is on), which sets a short-lived cookie (one-time state,
   nonce, PKCE secret, and that address) and sends the person to Google, telling it to come back to that address.
2. Google returns the person to `/api/auth/google/callback` on that address, which swaps the code for the person's identity with the client
   secret, checks it (state, nonce, audience, issuer, expiry, verified e-mail), and signs them in with the same cookie a
   password sign-in uses.
3. A person Google already knows to us is signed in. Someone with a password account and the same **verified** e-mail is
   joined to it. Anyone else gets a new **Free** workspace (one person, one number), unless self-service sign-up is switched
   off (`ALLOW_PUBLIC_SIGNUP=false`), in which case only existing accounts can use Google.
4. A plan chosen on the pricing page travels with them (`?plan=growth&interval=annual`). Free goes straight in. A paid plan
   opens its payment for them, priced by the server; the plan is never given without payment.

A Google-only person has no password; "Forgot password" lets them choose one.

## Limits

- Google's own consent screen must be set to **In production** (not "Testing") before people outside your own test users can
  sign in. In "Testing" Google refuses everyone not listed.
- Payment is in rupees through Razorpay only, so a dirham plan or Enterprise still goes through the contact form.
- The older guest checkout at `/checkout` on the website still works if someone opens the address, but the pricing page no
  longer links to it.
