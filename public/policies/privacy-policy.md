## Privacy Policy

**Effective Date:** January 1, 2026  
**Last Updated:** September 8, 2026  
**Website:** [jaainil.com](https://jaainil.com) ("Site", "we", "us", or "our")  
**Data Fiduciary & Controller:** Jainil Prajapati, Anand, Gujarat, India  

---

## 1. Introduction and Scope

This Privacy Policy explains how Jainil Prajapati ("we", "us", "our") collects, uses, processes, stores, and protects information when you visit [jaainil.com](https://jaainil.com), read our technical articles (formerly published under the Shravonix imprint), utilize the on-site AI assistant ("Ask Jainil's AI"), or communicate with us for software engineering, DevOps consulting, or hiring opportunities.

We are committed to strict **data minimization**. We do not run commercial ad trackers, we do not build cross-site behavioral profiles, and we never sell or rent your personal data to third parties.

This policy has been prepared in compliance with applicable data protection laws, including:
- **India:** The Digital Personal Data Protection Act, 2023 (DPDP Act) and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 (SPDI Rules).
- **European Union & United Kingdom:** The General Data Protection Regulation (EU GDPR / UK GDPR) and the ePrivacy Directive (Directive 2002/58/EC).
- **United States:** The California Consumer Privacy Act of 2018 as amended by the California Privacy Rights Act of 2020 (CCPA / CPRA).

---

## 2. Data Fiduciary & Grievance Officer Details

Under Section 8(10) of India's DPDP Act 2023 and Rule 5(9) of the SPDI Rules 2011, the designated Data Fiduciary and Grievance Officer for this website is:

- **Name:** Jainil Prajapati
- **Role:** Independent Full-Stack Developer & DevOps Engineer (Data Fiduciary / Grievance Officer)
- **Physical Address:** Anand, Gujarat 388001, India
- **Email:** [jainilprajapati9@gmail.com](mailto:jainilprajapati9@gmail.com)
- **Telephone:** [+91 97252 84302](tel:+919725284302)
- **Grievance Redressal Timeline:** Initial acknowledgment within 24 hours; full resolution within 30 days.

---

## 3. Information We Collect and Process

We collect only the minimum personal and technical information strictly necessary to operate, protect, and analyze the site:

### A. Cookieless, Privacy-Preserving Analytics Data
We utilize a private, self-hosted instance of **Umami Analytics** to count overall page visits and understand which technical deep dives are read.
- **Data processed:** Anonymized page URL, referrer URL, browser family, operating system, device category (desktop/mobile/tablet), and approximate geographic country.
- **Privacy safeguard:** Umami is cookieless by design. It does not use persistent cookies, does not store unique visitor fingerprints across websites, and does not track you across different web domains. All IP addresses are anonymized in memory and never stored in persistent databases.

### B. Client-Side Browser Local Storage
To deliver a smooth user experience without tracking cookies, the site stores minimal technical preferences locally inside your browser's `localStorage` and `sessionStorage`:
- `theme`: Stores your selected visual theme (`dark` or `light`).
- `cookie_consent_v1`: Stores your preference for site storage (`all` or `essential`) and consent timestamp.
- `ragchat_messages_v1`: Retains your recent conversation turns with the on-site AI assistant so your chat history is not lost when navigating between articles.
- `ragchat_open_v1`: Remembers whether the chat modal was open during page reloads.
- `ragchat-hint`: Remembers whether you have dismissed the mobile chat prompt bubble.

*Note:* All local storage items remain entirely within your own browser and can be cleared at any time through your browser settings or via the "Reset Conversation" and "Cookie Settings" controls on this site.

### C. Interactive AI Assistant Queries ("Ask Jainil's AI")
When you interact with the on-site search or RAG AI assistant:
- We process your submitted text prompt and the recent conversation turns to query our static knowledge base (articles, resume, and project documentation) and generate answers.
- **AI Processing:** Inference is powered by enterprise AI APIs (Google Gemini API / OpenRouter). Queries are transmitted over encrypted TLS connections.
- **Abuse Prevention & Rate Limiting:** We record a temporary SHA-256 hash of your client IP address in a volatile in-memory cache (Redis/Dragonfly) solely to enforce rate limits (maximum 20 queries per minute) to protect server resources against denial-of-service attacks. This rate limit counter automatically expires and is permanently deleted after 60 seconds.
- **Consent & Notice:** Please do not submit confidential, classified, or sensitive personal data into the chat. Conversation messages are not sold, used for commercial advertising, or used to train public foundation models without your explicit consent.

### D. Direct Inquiries and Communications
When you contact us via email ([jainilprajapati9@gmail.com](mailto:jainilprajapati9@gmail.com)) or telephone ([+91 97252 84302](tel:+919725284302)):
- We collect your name, email address, phone number, organization (if applicable), and message details.
- This information is used exclusively to respond to your technical questions, explore job opportunities, or coordinate freelance development contracts.

### E. Margin Notes and Article Comments (Giscus / GitHub Discussions)
Article discussions are powered by **Giscus**, an open-source commenting system integrated with **GitHub Discussions**:
- The comments iframe is hosted directly by Giscus (`giscus.app`) and GitHub, Inc. (`github.com`).
- If you choose to comment, you log in using your GitHub account. Your comment text, GitHub username, avatar, and profile link are processed by GitHub under the [GitHub Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement). We do not collect or store your GitHub credentials or personal profile data on our servers.

---

## 4. Legal Bases for Processing

Under Article 6 of the EU/UK GDPR and Section 6 of India's DPDP Act 2023, our processing activities are grounded on the following legal bases:
1. **Legitimate Interests (Art. 6(1)(f) GDPR):** To ensure website security, mitigate automated bots and DDoS attempts via rate-limiting, debug technical defects, and understand aggregate readership metrics through cookieless analytics.
2. **Consent (Art. 6(1)(a) GDPR & Section 6 DPDP Act):** For processing user-submitted queries in the interactive AI chat assistant, voluntary participation in GitHub-hosted margin notes, and saving optional functional preferences in browser storage.
3. **Performance of a Contract or Pre-Contractual Steps (Art. 6(1)(b) GDPR):** For reviewing project requirements, responding to hiring proposals, preparing statements of work, and delivering contracted software engineering services.
4. **Legal Compliance (Art. 6(1)(c) GDPR):** To satisfy statutory accounting, tax, or legal requirements in India.

---

## 5. Third-Party Service Providers (Sub-Processors)

We engage only trusted infrastructure providers who adhere to strict data security and privacy standards:
- **Vercel Inc. (USA):** Content Delivery Network (CDN), edge caching, and serverless hosting.
- **Umami:** Self-hosted, privacy-first web analytics platform.
- **Google LLC (Gemini API) & OpenRouter:** AI model inference for the retrieval-augmented generation (RAG) assistant.
- **GitHub, Inc. (USA):** Hosting source code repositories and powering interactive article discussions via Giscus.
- **Dragonfly / Redis:** In-memory caching for API rate-limiting and temporary answer retrieval (keys expire within 60s to 1 hour).

---

## 6. Data Retention Policy

- **Rate Limiting Data:** Volatile IP counter records in Redis expire automatically after **60 seconds**.
- **AI Query Answer Cache:** Query response caches expire automatically after **1 hour** or upon knowledge base redeployment.
- **Browser Local Storage:** Stored on your device indefinitely until you clear your browser cache or reset preferences.
- **Direct Correspondence:** Retained for the duration of the professional inquiry or contractual relationship, and for up to 3 years thereafter for audit, tax, and legal defense purposes.

---

## 7. Your Legal Rights

Depending on your jurisdiction, you hold specific enforceable rights regarding your personal data:

### Under the Indian Digital Personal Data Protection Act, 2023 (DPDP Act):
- **Right to Access Information:** You may request a summary of personal data being processed and the processing activities undertaken.
- **Right to Correction and Erasure:** You may request correction of inaccurate or misleading data, completion of incomplete data, or erasure of personal data that is no longer necessary.
- **Right of Grievance Redressal:** You have the right to register grievances with our Grievance Officer and receive resolution within 30 days. If dissatisfied, you may appeal to the **Data Protection Board of India**.
- **Right to Nominate:** You may nominate any individual to exercise your data rights in the event of death or incapacity.

### Under the EU / UK GDPR:
- **Right of Access (Art. 15):** Request a copy of your personal data.
- **Right to Rectification (Art. 16):** Correct inaccurate or incomplete data.
- **Right to Erasure / "To Be Forgotten" (Art. 17):** Request deletion of your personal data where grounds apply.
- **Right to Restrict Processing (Art. 18):** Restrict how your data is processed under specific circumstances.
- **Right to Data Portability (Art. 20):** Receive your data in a structured, machine-readable format.
- **Right to Object (Art. 21):** Object to processing based on legitimate interests.
- **Right to Withdraw Consent:** Where processing is based on consent, withdraw your consent at any time without penalty.
- **Right to Lodge a Complaint:** You may file a complaint with your local European Data Protection Authority (DPA) or the UK Information Commissioner's Office (ICO).

### Under the California Consumer Privacy Act (CCPA / CPRA):
- **Right to Know & Delete:** Request disclosure of categories and specific pieces of personal data collected, and request deletion.
- **"Do Not Sell or Share My Personal Information":** We do **not** sell, monetize, or share your personal information for cross-context behavioral advertising.
- **Non-Discrimination:** You will never be denied services or charged different rates for exercising your privacy rights.

To exercise any of these rights, contact us at [jainilprajapati9@gmail.com](mailto:jainilprajapati9@gmail.com). We will verify your request and respond within the statutory timeframe (typically within 30 days).

---

## 8. Children's Privacy

This site provides technical systems engineering articles and a developer portfolio. It is not intended for or directed at children under the age of 18 (in India) or under 16 (in the EU/US). We do not knowingly collect personal information from children. If you believe a minor has provided us with personal information, please contact us immediately for prompt deletion.

---

## 9. Security Safeguards

We implement appropriate technical and organizational measures to safeguard your information:
- HTTPS / TLS 1.3 encryption across all website endpoints.
- Strict Content Security Policy (CSP) and secure HTTP response headers.
- Input validation and sanitization to prevent prompt injection and cross-site scripting (XSS).
- Transient in-memory storage for rate-limiting with automated TTL expiry.

---

## 10. AI Transparency Notice (EU AI Act Compliance)

In compliance with Article 50 of the EU Artificial Intelligence Act:
The "Ask Jainil's AI" feature on this website is an **automated artificial intelligence system**. It generates natural-language answers using retrieval-augmented generation (RAG) based on public portfolio content. AI responses are generated automatically and do not represent legally binding representations or formal contractual commitments by Jainil Prajapati.

---

## 11. Policy Updates

We may update this Privacy Policy periodically to reflect changes in our technical architecture, legal obligations, or service offerings. Any revisions will be published on this page with an updated "Last Updated" timestamp.

---

## 12. Contact and Grievance Inquiries

For questions, feedback, or requests regarding this Privacy Policy:

- **Jainil Prajapati**  
- **Postal Address:** Anand, Gujarat 388001, India  
- **Email:** [jainilprajapati9@gmail.com](mailto:jainilprajapati9@gmail.com)  
- **Phone:** [+91 97252 84302](tel:+919725284302)  
- **Website:** [https://jaainil.com](https://jaainil.com)
