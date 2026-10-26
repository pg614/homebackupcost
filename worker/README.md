# HomeBackupCost email Worker

Handles two POSTs from the site. Nothing works until the flag and keys are set, and right now none are.

- `POST /report`: `{email, consent:true, company:"", report:{...}}`. The Worker validates the input, **rebuilds the report on the server** from the structured numbers (`src/data/report.js`; it never trusts HTML from the client), emails it through Resend, and adds the address to the list with the tag `report`.
- `POST /subscribe`: `{email, consent:true, company:""}`. Adds the address to the list with the tag `footer`.

Protections: an origin allow-list (CORS), a honeypot field (`company`, filled only by bots, gets a fake 200), email and consent validation, a 16 KB body cap, report number ranges and https-only URLs, and a per-IP limit of 5 requests per 10 minutes. The per-IP limit is per isolate, so also add the Cloudflare rule below. The Worker stores nothing itself.

## Friday checklist (accounts and settings needed)

1. **Domain**: buy homebackupcost.com and put its DNS on **Cloudflare** (free plan). Point the site at it.
2. **Cloudflare account** (free): `npm i -g wrangler && wrangler login`. Then in this folder run `wrangler deploy`, and add the custom domain `api.homebackupcost.com` (uncomment `routes` in wrangler.toml).
3. **Resend** (free tier: 3,000 emails/mo, 100/day): sign up, then go to Domains → add `mail.homebackupcost.com` and add the SPF/DKIM (and DMARC) records it shows in Cloudflare DNS. Wait until it says Verified. Create an API key with **Sending access** only.
   - `wrangler secret put RESEND_API_KEY`
   - Set `FROM_EMAIL = "HomeBackupCost <report@mail.homebackupcost.com>"` and `REPLY_TO` to Paul's inbox.
4. **Newsletter list**: pick one.
   - **Buttondown** (free up to 100 subscribers): Settings → API → copy the key → `wrangler secret put BUTTONDOWN_API_KEY`. Keep `NEWSLETTER_PROVIDER="buttondown"`. Turn on double opt-in (Settings → Subscribing) and set the sender name and the mailing address CAN-SPAM requires.
   - **Beehiiv** (free up to 2,500): Settings → API → create a key and copy the publication ID (`pub_…`). Run `wrangler secret put BEEHIIV_API_KEY` and `wrangler secret put BEEHIIV_PUBLICATION_ID`, then set `NEWSLETTER_PROVIDER="beehiiv"`.
   - Set `UNSUBSCRIBE_URL` to the provider's public manage/unsubscribe page.
5. **Flip the Worker on**: set `EMAIL_ENABLED = "true"` in wrangler.toml, then `wrangler deploy`.
6. **Rate-limit rule** (Cloudflare dashboard → Security → WAF → Rate limiting rules, 1 free rule): path starts with `/report` or `/subscribe`, 10 requests per 10 s per IP → Block.
7. **Flip the site on**: build with `PUBLIC_EMAIL_ENABLED=true PUBLIC_EMAIL_ENDPOINT=https://api.homebackupcost.com` (add both to the GitHub Actions build env in `.github/workflows/pages.yml`). Both are required; if either is missing, the forms stay "Coming soon".
8. **Privacy page**: confirm the providers named on /privacy/ match what you picked (it says Resend + Buttondown), add a contact email, and set the effective date.
9. **Test**: send yourself a report from Quick Check and from /calculator/ on your phone, confirm it arrives (check spam), the unsubscribe link works, and you show up in the list with the `report` tag.

## Local test

`node worker/test-worker.mjs` from the repo root (uses mocked fetch; no network, no keys).
