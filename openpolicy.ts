import { defineConfig, Statutory, Contractual, Voluntary } from "@openpolicy/sdk";

export default defineConfig({
  company: {
    name: "Jainil Prajapati",
    legalName: "Jainil Prajapati",
    address: "A/6 Shantivilla Residency, SVIT College Road, Vasad, Anand, Gujarat 388306, India",
    contact: { email: "jainilprajapati9@gmail.com" },
  },
  effectiveDate: "2026-01-01",
  jurisdictions: ["sg"],
  data: {
    collected: {
      "Account Information": ["Name", "Email address"],
      "Usage Data": ["Pages visited", "Browser type", "IP address"],
    },
    context: {
      "Account Information": {
        purpose: "Account management and communication",
        lawfulBasis: "legitimate_interests",
        retention: "Until account deletion",
        provision: Contractual("Required for account creation and service access"),
      },
      "Usage Data": {
        purpose: "Understanding how visitors use our website",
        lawfulBasis: "legitimate_interests",
        retention: "Until account deletion",
        provision: Voluntary("Helps us improve our service"),
      },
    },
  },
  cookies: {
    used: { essential: true, analytics: true },
    context: {
      essential: { lawfulBasis: "legitimate_interests" },
      analytics: { lawfulBasis: "consent" },
    },
  },
  thirdParties: [
    {
      name: "Umami",
      purpose: "Website analytics to understand visitor behavior",
      policyUrl: "https://umami.is/privacy-policy",
    },
  ],
  consentMechanism: {
    hasBanner: true,
    hasPreferencePanel: true,
    canWithdraw: true,
  },
  trackingTechnologies: ["web beacons", "local storage"],
});