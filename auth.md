# auth.md

Authentication and credential provisioning for autonomous agents interacting
with Fervon (https://fervon.dev). Last updated 2026-08-25. Maintained at
https://github.com/Fervon/fervon/blob/main/auth.md

This file is self-contained. Fervon runs no OAuth authorization server, so
there is no two-hop discovery to perform: everything an agent needs is below.

## Audience

- Search, citation and browsing agents reading fervon.dev for a user.
- CI agents that install or configure a Fervon product in a pipeline.
- Scanners checking this origin for agent-readiness metadata.

## Step 1 - Discover

fervon.dev is a static, fully public website. It exposes no protected API, no
authorization server and no token endpoint. There is nothing to sign in to.

There is deliberately **no OAuth metadata on this origin**:

| Document | Status | Why |
| --- | --- | --- |
| `/.well-known/oauth-protected-resource` (RFC 9728) | absent | Nothing on this host is protected, so there is no resource to describe |
| `/.well-known/oauth-authorization-server` (RFC 8414) | absent | Fervon operates no authorization server and issues no access tokens |
| Dynamic client registration (RFC 7591) | absent | There is no client to register and no `register_uri` on this host |

This host never returns `401` and never sends a `WWW-Authenticate` header.
Treat the absence as intentional, not as a missing document. If Fervon ever
ships a protected HTTP API, Protected Resource Metadata and an `agent_auth`
block will be published here and at the well-known locations above.

What to fetch instead:

| Resource | URL | Media type |
| --- | --- | --- |
| API catalog (RFC 9727) | `/.well-known/api-catalog` | `application/linkset+json` |
| Site description for agents | `/llms.txt` | `text/plain` |
| Sitemap | `/sitemap.xml` | `application/xml` |
| News feed (es / en) | `/blog/feed.xml`, `/en/blog/feed.xml` | `application/rss+xml` |
| Crawling policy | `/robots.txt` | `text/plain` |
| Security contact (RFC 9116) | `/.well-known/security.txt` | `text/plain` |

Those are also advertised as `Link` response headers on every response, using
the `api-catalog`, `service-desc`, `service-doc` and `describedby` relations.

## Step 2 - Pick a method

| What you want to do | Method | Credential needed |
| --- | --- | --- |
| Read any page, feed or data file on fervon.dev | none | none |
| Run Veredicto in a CI pipeline | `veredicto-repository-licence` | yes |
| Run Trace on a desktop | `trace-desktop-licence` | yes |

**Reading requires no registration and no credential.** No API key, account or
token is issued for reading fervon.dev. Every URL in the sitemap is anonymous
over HTTPS.

What does apply to reading is `/robots.txt`. It allows search-and-citation
agents (`OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `Claude-User`,
`PerplexityBot`, `Perplexity-User`, `Google-Extended`) and denies bulk training
crawlers (`GPTBot`, `CCBot`, `ClaudeBot`, `Bytespider`, `Amazonbot` and
others). No credential grants an exemption from it.

## Step 3 - Register

Both methods are self-serve and **completed by the human operator in a
browser**. The registration URI is a hosted checkout page, not a machine
endpoint: an agent surfaces it to its user and stops there. Do not POST to it.

### Method: veredicto-repository-licence

| Field | Value |
| --- | --- |
| Product | Veredicto, a GitHub Action that flags AI-written tests which do not test anything |
| Runs in | The buyer's own CI runner |
| Registration URI | `https://buy.polar.sh/polar_cl_ir1Idm0ddrPHPDUqy6bEP7cIpXA8ls1cWAP3f09bDie` |
| Registration method | Self-serve subscription checkout. Polar is the merchant of record |
| Required input | GitHub repository, as `owner/name` or `owner/*`. The licence is bound to it |
| Credential type | Ed25519-signed licence key |
| Delivery | E-mail, after purchase |
| Scope | One repository, or one owner with `owner/*` |
| Expiry | The licence expires and is renewed by the subscription |
| Documentation | https://fervon.dev/veredicto/ and https://fervon.dev/en/veredicto/ |

### Method: trace-desktop-licence

| Field | Value |
| --- | --- |
| Product | Trace, local-first personal memory for Windows, macOS and Linux |
| Runs in | The user's own machine |
| Registration URI | `https://buy.polar.sh/polar_cl_uQFZh6NjMqG5zp0RVGHSjITzIJVn1CPA2uB4N0DUmNc` |
| Registration method | Self-serve one-time purchase. Polar is the merchant of record |
| Required input | None beyond payment details |
| Credential type | Licence key |
| Delivery | E-mail, after purchase |
| Scope | The user's own devices |
| Expiry | None. It is a one-time purchase |
| Documentation | https://fervon.dev/trace/ and https://fervon.dev/en/trace/ |

## Step 4 - Use the credential

There is no claim ceremony and no assertion exchange, because there is no
authorization server to exchange anything with.

**Bearer methods supported: none.** Neither credential is a bearer token and
neither is ever sent in an `Authorization` header, to fervon.dev or anywhere
else.

- `veredicto-repository-licence`: store the key as the GitHub Actions secret
  `VEREDICTO_LICENSE` in the repository it was issued for. The Action verifies
  it **offline**, against a public key embedded in its own source. Nothing is
  sent to any server, ever.
- `trace-desktop-licence`: enter the key once in the desktop app. It is
  validated locally. There is no account, no login and no server-side session.

## Errors

| Situation | What happens | What to do |
| --- | --- | --- |
| Veredicto runs with no `VEREDICTO_LICENSE` | The Action fails at start-up and analyses nothing | Register with `veredicto-repository-licence` |
| Veredicto licence is for another repository | The Action fails at start-up | Re-issue the licence for the right `owner/name` |
| Veredicto licence has expired | The Action fails at start-up | Renew the subscription |
| A request to a protected path on fervon.dev | Never happens. Every path is public or returns `404` | Nothing to authenticate |

Failing closed is deliberate for Veredicto: a run that finds nothing because it
never started is indistinguishable from a clean pull request, and that is the
one failure a paid check cannot afford.

## Revocation

- Credential: cancelling the Polar subscription stops renewal and the licence
  expires on its own. There is no token revocation endpoint (RFC 7009) because
  there are no tokens.
- Registration: there is no registration record on this host to revoke, and no
  security event stream (RFC 8935) to subscribe to.

## Do not probe

This origin has **no registration endpoint**. Do not POST to `/agent/auth`,
`/register`, `/oauth2/token`, `/oauth/*` or any similar path. They do not
exist and return `404`. This file, `/.well-known/api-catalog` and `/llms.txt`
are the complete and authoritative source of truth.

The only form on the site is the contact form at `/contacto/` and
`/en/contacto/`, which posts to Formspree and is meant for humans.

## Contact

- General: https://fervon.dev/contacto/ and https://fervon.dev/en/contacto/
- Security: `/.well-known/security.txt`, which points to
  mailto:jonathanmartinpaez@gmail.com
