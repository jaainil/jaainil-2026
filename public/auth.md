---
title: "Agent Authentication & Authorization"
description: "Instructions and endpoints for AI agents connecting to jaainil.com APIs"
version: "1.0.0"
---

# Agent Authentication Guide (Auth.md)

Welcome to `jaainil.com`. This document provides instructions for AI agents, crawlers, and automated assistants to authenticate with public and protected resources.

## 1. Discovery Endpoints
- **OAuth 2.0 Authorization Server:** `https://jaainil.com/.well-known/oauth-authorization-server`
- **OpenID Connect Configuration:** `https://jaainil.com/.well-known/openid-configuration`
- **OAuth Protected Resource Metadata:** `https://jaainil.com/.well-known/oauth-protected-resource`
- **Agent Resource Discovery:** `https://jaainil.com/.well-known/ai-catalog.json`

## 2. Agent Registration
- **Registration URI:** `https://jaainil.com/auth/register`
- **Grant Types:** `client_credentials`, `authorization_code`
- **Supported Identity Types:** `agent`, `user`
- **Supported Credential Types:** `client_secret`, `mtls`, `jwt`

## 3. Scopes & Permissions
- `read:articles` — Read all published technical articles and metadata
- `read:profile` — Access public developer profile and contact points

## 4. Contact & Inquiries
- **Maintainer:** Jainil Prajapati
- **Email:** `jainilprajapati9@gmail.com`
- **Website:** `https://jaainil.com`
