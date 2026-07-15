# RebateBoard Cookie Consent Launch Notes

This launch implementation provides a first-party Cookie Preferences interface with a temporary local-storage consent adapter.

It is not a certified Consent Management Platform and does not provide geo-targeting, server-side consent logs, automated cookie scanning, CookieYes script blocking, or legal certification. The UI and consent API are designed so CookieYes can replace the storage/consent backend later without redesigning the interface.

## Current Audit

| Service / Storage | Location | Current behavior | Category | Delayable | Notes |
| --- | --- | --- | --- | --- | --- |
| RebateBoard auth session | `src/lib/auth.tsx`, API helpers | Local session required for login and protected API calls | Essential | No | Core account/security behavior. |
| Consent preference storage | `src/lib/cookie-consent.tsx` | Stores consent choice only | Essential | No | Does not store personal data. |
| Language preference | `src/lib/i18n.tsx` | Saves selected language in local storage | Functional | Yes | Convenience preference. |
| Dashboard/layout/filter preferences | dashboard, comparison, calendar routes | Saves user-selected UI preferences locally | Functional | Yes | Convenience, not required for core security. |
| Search analytics events | `src/lib/search-analytics.ts` | Previously stored locally and posted to API | Analytics | Yes | Now gated by Analytics consent. |
| Onboarding analytics | `src/lib/onboarding-analytics.ts` | Internal admin analytics from signup answers | Analytics / Product operations | Needs legal review | Submitted as part of onboarding flow, not a third-party tracker. |
| TradingView Economic Calendar | `src/routes/economic-calendar.tsx` | Third-party widget script/iframe | Functional | Yes | Now gated by Functional consent. |
| YouTube homepage video iframe | `src/routes/index.tsx` | Third-party iframe loads only on play | Functional | Yes | Thumbnails may render as normal images; iframe is gated. |
| Social links | `src/components/SiteFooter.tsx`, community routes | Plain outbound links | N/A | N/A | No embed script detected. |
| Marketing pixels | Global frontend | None detected | Marketing | Yes | Marketing preference is ready for future pixels. |
| GA/GTM/Meta/TikTok/Hotjar/PostHog/Mixpanel | Global frontend | None detected | Analytics / Marketing | Yes | Add only behind consent gates. |

## Future CookieYes Migration

1. Keep the RebateBoard UI components:
   - `CookieConsentProvider`
   - `CookieConsentBanner`
   - `CookiePreferencesModal`
   - `CookiePreferencesTrigger`
   - `ConsentGate`
2. Implement `CookieYesConsentAdapter` using the `ConsentStorageAdapter` interface in `src/lib/cookie-consent.tsx`.
3. Map categories:
   - essential -> necessary
   - functional -> functional
   - analytics -> analytics
   - personalization -> preferences / functional, depending on CookieYes configuration
   - marketing -> advertisement
4. Add the CookieYes script only after the final production domain is verified and scanned.
5. Replace `LocalConsentStorageAdapter` at the provider boundary, not inside the UI components.
6. Keep the footer `Cookie Preferences` trigger connected to the RebateBoard preference centre or CookieYes preference centre through the adapter.
7. Test Accept All, Reject Optional, custom preferences, revocation, cross-tab sync, and version renewal on the production domain.

## Development Reset

Outside production, run this in the browser console to reset consent:

```js
window.rbResetCookieConsent()
```

