# Deterministic quality gate

The gate produces `pass`, `review` or `fail`. A failed item keeps content as a draft.

## Automatic fail

- Cluster is missing from `semantic-map.json`, conflicts with `protected-pages.json` or is owned by another page.
- Slug is not lowercase Latin and hyphenated.
- Title, H1 or canonical duplicates another live item.
- No category, excerpt, body, author, SEO title or SEO description.
- More than one H1 inside article content.
- Script, iframe, inline event handler or `javascript:` URL is present.
- Finance/legal/safety/structure topic lacks `human_review_required: true`.
- Word count is zero or the draft still contains placeholders such as `TODO`, `TBD`, `needs_expert_input`.
- Required internal link to the commercial owner is absent.

## Mandatory review

- Price, duration, warranty, rate, law, government programme or technical recommendation is mentioned.
- Article contains an Evtenia case, quote, project figure or comparison table.
- AI-generated illustration could be mistaken for a real project.
- Search intent differs from the approved brief.

## Pass checks

- Main question is answered near the start.
- Article covers all brief questions without obvious repetition.
- Claims have sources or approved company evidence.
- Trade-offs and unsuitable scenarios are explained.
- CTA matches the intent.
- At least two contextual internal links are present where relevant.
- Metadata, dates, author data and structured-data fields are complete.

## Gate output

Save a report in `reports/<cluster-id>-gate.json` with rule IDs, result, evidence and remediation. Never silently alter a failed draft to make it pass.
