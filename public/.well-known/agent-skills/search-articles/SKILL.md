---
name: "search-articles"
description: "Search and retrieve technical engineering articles, Linux deep dives, and DevOps benchmarks by Jainil Prajapati"
version: "1.0.0"
metadata:
  author: "Jainil Prajapati"
  url: "https://jaainil.com/articles"
---

# Search Articles Skill

This skill allows AI agents to query the catalog of technical writing published on `jaainil.com`.

## Inputs
- `query` (string, optional): Keywords to filter articles by title, tag, or topic.
- `category` (string, optional): One of `Linux`, `AI`, `Tech`, `IoT`, `Opinions`, `Programming`.

## Corpus Endpoint
- Full raw markdown archive: `https://jaainil.com/llms-full.txt`
- Article list index: `https://jaainil.com/llms.txt`
