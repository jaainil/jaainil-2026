# DNS for AI Discovery (DNS-AID) & Agent Configuration
# RFC 9460 & draft-mozleywilliams-dnsop-dnsaid

This document provides the exact DNS records to configure on your DNS provider (Cloudflare, Namecheap, Route53, etc.) for `jaainil.com`.

---

## 1. DNS-AID Index Discovery Record (SVCB / HTTPS)

Add an **HTTPS** or **SVCB** record at the sub-name `_index._agents`:

- **Name / Host:** `_index._agents` (or `_index._agents.jaainil.com`)
- **Type:** `HTTPS` (or `SVCB` with SvcPriority 1)
- **Priority:** `1`
- **Target:** `jaainil.com.`
- **Parameters (Value):**
  ```text
  alpn="h2,h3" port="443" key65300="/.well-known/ai-catalog.json"
  ```

---

## 2. Text (TXT) Fallback Discovery Records

For DNS providers that do not yet support SVCB/HTTPS parameters:

- **Record 1 (AI Catalog & Agent Directory):**
  - **Name / Host:** `_agents.jaainil.com`
  - **Type:** `TXT`
  - **Value:** `v=aid1; catalog=https://jaainil.com/.well-known/ai-catalog.json; llms=https://jaainil.com/llms.txt; mcp=https://jaainil.com/.well-known/mcp/server-card.json`

- **Record 2 (API Catalog):**
  - **Name / Host:** `_api.jaainil.com`
  - **Type:** `TXT`
  - **Value:** `v=api1; catalog=https://jaainil.com/.well-known/api-catalog`

---

## 3. Enable DNSSEC

In your DNS dashboard (e.g., Cloudflare DNS > Settings), enable **DNSSEC** with one click.
This cryptographically signs the public discovery zone so AI agent resolvers can authenticate the DNS-AID records.
