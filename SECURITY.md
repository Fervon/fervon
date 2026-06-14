# Security Policy

## Reporting a Vulnerability

If you've found a security issue affecting Fervon (the studio, fervon.dev, or any of its sites/products under this domain or org), please report it privately.

- **Email**: jonathanmartinpaez@gmail.com
- **Subject**: prepend `[fervon-security]` so it's prioritised
- **PGP**: not currently published — plain email is fine, GitHub-side reports also work via the Security tab on individual repos
- **Languages**: Spanish or English

Please include:

- A clear description of the issue and its impact
- Steps to reproduce (PoC if possible)
- Any affected URLs, commits, or configuration
- Your name/handle if you want public credit

I'll acknowledge receipt within 72 hours and aim to triage within 7 days. Critical issues get same-day attention.

## Scope

In scope:

- `fervon.dev` and any `*.fervon.dev` subdomain
- The `Fervon` GitHub organization and its public repositories
- The `fervon` npm package and `@fervon` scope
- Build/deploy pipelines (GitHub Actions on the org)

Out of scope:

- Third-party services we depend on (GitHub, Cloudflare, Formspree, etc.) — please report directly to them
- DoS / volumetric attacks
- Social engineering of the maintainer
- Findings limited to self-XSS or that require physical access to the maintainer's device

## Safe Harbor

Good-faith research within this scope is welcome. I won't pursue legal action against researchers who:

- Make a good-faith effort to avoid privacy violations and service disruption
- Don't exfiltrate data beyond what's necessary to prove the issue
- Give reasonable time to remediate before public disclosure
- Don't disclose the issue publicly before remediation (a 90-day disclosure window is the default)

## Recognition

Hall of fame for confirmed reports lives in this file once it has names. Send a PR or include preferred attribution in your report.
