import { defineConfig, Statutory, Contractual, Voluntary } from "@openpolicy/sdk";

export default defineConfig({
  company: {
    name: "Jainil Prajapati",
    legalName: "Jainil Prajapati",
    address: "A/6 Shantivilla Residency, SVIT College Road, Vasad, Anand, Gujarat 388306, India",
    contact: { email: "jainilprajapati9@gmail.com" },
  },
  effectiveDate: "2026-01-01",
  jurisdictions: ["eu", "uk", "us-ca"],
  data: {
    collected: {
      "Contact Information": ["Name", "Email address", "Phone number", "Message content"],
      "Usage Data": ["Pages visited", "Browser type", "IP address"],
    },
    context: {
      "Contact Information": {
        purpose: "Responding to inquiries, hiring, and contract correspondence",
        lawfulBasis: "legitimate_interests",
        retention: "Duration of the inquiry or contract, plus up to 3 years",
        provision: Contractual("Required to respond to your inquiry"),
      },
      "Usage Data": {
        purpose: "Understanding how visitors use our website",
        lawfulBasis: "legitimate_interests",
        retention: "Aggregated, anonymized analytics; IP addresses are anonymized in memory and not stored",
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