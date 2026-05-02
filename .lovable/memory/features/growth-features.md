---
name: Growth Features
description: Referral links, social share, newsletter signup, SEO meta and GA4 analytics
type: feature
---
## Tables
- `newsletter_subscribers` (email unique, source, language). Public INSERT, owner-only SELECT/UPDATE/DELETE.
- `referral_codes` (user_id unique, code unique, uses_count, signups_count). Public SELECT (for code resolution), owner can manage.
- `referral_events` (code, event_type click|signup, referred_user_id). Public INSERT, owner SELECT, code-owner SELECT own.

## RPCs
- `get_or_create_my_referral_code()` → returns the caller's code, generating one on first call.
- `track_referral_click(_code)` → public RPC, increments uses_count.
- Trigger `bump_referral_signup` increments `signups_count` automatically when an event with `event_type='signup'` is inserted.

## Frontend
- `src/components/SEO.tsx` — declarative meta/title/canonical updater per page.
- `src/components/SocialShare.tsx` — WhatsApp / Facebook / X / Copy link buttons.
- `src/components/NewsletterSignup.tsx` — footer email capture, zod-validated.
- `src/components/ReferralCard.tsx` — shown in user Settings → Account tab. Shows link + clicks/signups stats.
- `src/hooks/useReferralTracking.ts` — captures `?ref=CODE`, stores in localStorage, calls `track_referral_click`.
- `src/lib/analytics.ts` — GA4 loader (env: `VITE_GA_MEASUREMENT_ID`). Auto pageview on route change in `App.tsx`.
- Signup attributes referral on success and clears the stored code.

## Layout placement
- SocialShare → Hero only on Landing.
- NewsletterSignup → Footer (5th column) on Landing.
- SEO meta updated per language on Landing.
