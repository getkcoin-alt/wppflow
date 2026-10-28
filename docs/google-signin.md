# Google sign-in: what it is and how to switch it on

"Continue with Google" appears on the app's sign-in and sign-up pages (`https://app.scriwo.com`) once the server knows
Google's client id and secret. Without them the button is hidden and nothing else changes.

## Google Cloud settings (already done by the owner)

Client type **Web application**.

- Authorised JavaScript origins: `https://www.scriwo.com`, `https://scriwo.com`, `https://app.scriwo.com`
- Authorised redirect URI: `https://app.scriwo.com/api/auth/google/callback`

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

1. The button goes to `/api/auth/google/start`, which sets a short-lived cookie (one-time state, nonce, PKCE secret) and sends
   the person to Google.
2. Google returns the person to `/api/auth/google/callback`, which swaps the code for the person's identity with the client
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
