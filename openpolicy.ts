import { defineConfig } from "@openpolicy/sdk";

export default defineConfig({
  company: {
    name: "Shravonix",
    legalName: "Shravonix",
    address: "A/6 Shantivilla Residency, SVIT College Road, Vasad, Anand, Gujarat 388306, India",
    contact: "info@shravonix.com",
  },
  privacy: {
    effectiveDate: "2026-01-01",
    dataCollected: {
      "Account Information": ["Name", "Email address"],
      "Usage Data": ["Pages visited", "Browser type", "IP address"],
    },
    legalBasis: "Legitimate interests and consent",
    retention: { "Account data": "Until account deletion" },
    cookies: { essential: true, analytics: true, marketing: false },
    thirdParties: [
      {
        name: "Umami",
        purpose: "Website analytics to understand visitor behavior",
      },
    ],
    userRights: ["access", "erasure", "rectification", "portability", "restriction", "objection"],
    jurisdictions: ["other"],
  },
  terms: {
    effectiveDate: "2026-01-01",
    acceptance: { methods: ["using the service", "creating an account"] },
    eligibility: { minimumAge: 13 },
    prohibitedUses: [
      "Violating any applicable laws or regulations",
      "Transmitting spam or malicious content",
    ],
    termination: {
      companyCanTerminate: true,
      userCanTerminate: true,
    },
    disclaimers: {
      serviceProvidedAsIs: true,
      noWarranties: true,
    },
    limitationOfLiability: {
      excludesIndirectDamages: true,
      liabilityCap: "Total liability shall not exceed the greater of $100 or amounts paid in the past 12 months.",
    },
    governingLaw: { jurisdiction: "India" },
    changesPolicy: {
      noticeMethod: "email or prominent notice on our website",
      noticePeriodDays: 30,
    },
    privacyPolicyUrl: "/legal/privacy",
  },
  cookie: {
    effectiveDate: "2026-01-01",
    cookies: { essential: true, analytics: true, functional: false, marketing: false },
    thirdParties: [
      {
        name: "Umami",
        purpose: "Website analytics to understand visitor behavior",
        policyUrl: "https://umami.is/privacy-policy",
      },
    ],
    trackingTechnologies: ["web beacons", "local storage"],
    consentMechanism: { hasBanner: true, hasPreferencePanel: true, canWithdraw: true },
    jurisdictions: ["other"],
  },
});
