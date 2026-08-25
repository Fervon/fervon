# auth.md

> Authentication and credential-provisioning notes for autonomous agents
> interacting with Fervon — <https://fervon.dev>.
> Last updated: 2026-08-25 · Maintained at
> <https://github.com/Fervon/fervon/blob/main/auth.md>

## Summary

`fervon.dev` is a **static, fully public website**. It exposes **no protected
API, no authorization server and no token endpoint**. There is nothing to sign
in to and nothing to register for in order to read any page, feed or data file
on this host.

Two Fervon *products* do use credentials. Neither is provisioned by this host:
both are issued out of band through a self-serve purchase. They are documented
below so an agent can find the real flow instead of probing for one.

## Audience

- Search, citation and browsing agents reading `fervon.dev` on behalf of a user.
- CI agents that need to install or configure a Fervon product in a pipeline.
- Scanners checking this origin for agent-readiness metadata.

## Reading this site — no credentials

No API key, account or token is issued for reading `fervon.dev`. Every URL in
the sitemap is anonymous and unauthenticated over HTTPS.

| Resource | URL | Media type |
| --- | --- | --- |
| Site description for agents | `/llms.txt` | `text/plain` |
| API catalog (RFC 9727) | `/.well-known/api-catalog` | `application/linkset+json` |
| Sitemap | `/sitemap.xml` | `application/xml` |
| News feed (es / en) | `/blog/feed.xml`, `/en/blog/feed.xml` | `application/rss+xml` |
| Crawling policy | `/robots.txt` | `text/plain` |
| Security contact (RFC 9116) | `/.well-known/security.txt` | `text/plain` |

Those links are also advertised as `Link` response headers on every response,
using the `api-catalog`, `service-desc`, `service-doc` and `describedby`
relation types.

**Crawling policy matters here.** `/robots.txt` allows search-and-citation
agents (`OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `Claude-User`,
`PerplexityBot`, `Perplexity-User`, `Google-Extended`) and denies bulk training
crawlers (`GPTBot`, `CCBot`, `ClaudeBot`, `Bytespider`, `Amazonbot`, and
others). Respect it: there is no credential that grants an exemption.

## OAuth 2.0 status

There is **no OAuth metadata on this origin, by design**, because there is no
protected resource behind it:

- No `/.well-known/oauth-protected-resource` (RFC 9728) — nothing on this host
  is protected, so there is no resource to describe.
- No `/.well-known/oauth-authorization-server` (RFC 8414) — Fervon operates no
  authorization server and issues no access tokens.
- No dynamic client registration (RFC 7591), no `register_uri`.
- This host never returns `401` with a `WWW-Authenticate` header.

If Fervon ever ships a protected HTTP API, Protected Resource Metadata and an
`agent_auth` block will be published here and at the well-known locations above.
Until then, treat the absence as intentional rather than as a missing document.

## Credential provisioning for Fervon products

Both flows are **self-serve and human-completed**: an agent can discover and
present them, but the purchase itself is performed by the human operator.
Neither issues a credential that is sent to `fervon.dev`.

### Veredicto — repository licence

| | |
| --- | --- |
| What it is | A GitHub Action that flags AI-written tests which do not test anything |
| Where it runs | Entirely inside the buyer's CI runner |
| Provisioning URI | `https://buy.polar.sh/polar_cl_ir1Idm0ddrPHPDUqy6bEP7cIpXA8ls1cWAP3f09bDie` |
| Method | Self-serve subscription checkout (Polar is the merchant of record) |
| Required input | GitHub repository, as `owner/name` or `owner/*` — the licence is bound to it |
| Credential type | Ed25519-signed licence key, delivered by e-mail after purchase |
| How it is used | Stored as the GitHub Actions secret `VEREDICTO_LICENSE` |
| Verification | **Offline**, against a public key embedded in the Action. Nothing is sent to any server, ever |
| Bearer methods | None. This is not a bearer token and is never sent in an `Authorization` header |
| Scope / expiry | One repository (or one owner). The licence expires and is renewed by the subscription |
| Human docs | <https://fervon.dev/veredicto/> · <https://fervon.dev/en/veredicto/> |

### Trace — desktop licence

| | |
| --- | --- |
| What it is | Local-first personal memory for Windows, macOS and Linux |
| Where it runs | On the user's own machine |
| Provisioning URI | `https://buy.polar.sh/polar_cl_uQFZh6NjMqG5zp0RVGHSjITzIJVn1CPA2uB4N0DUmNc` |
| Method | Self-serve one-time purchase (Polar is the merchant of record) |
| Credential type | Licence key delivered by e-mail after purchase |
| How it is used | Entered once in the desktop app; validated locally |
| Bearer methods | None. There is no account, no login and no server-side session |
| Human docs | <https://fervon.dev/trace/> · <https://fervon.dev/en/trace/> |

## Do not probe

This origin has **no registration endpoint**. Do not `POST` to `/agent/auth`,
`/register`, `/oauth/*` or any similar path: they do not exist and will return
`404`. Public discovery documents — this file, `/.well-known/api-catalog` and
`/llms.txt` — are the complete and authoritative source of truth.

The only form on the site is the contact form at `/contacto/`
(`/en/contacto/`), which posts to Formspree and is intended for humans.

## Contact

- General: <https://fervon.dev/contacto/> · <https://fervon.dev/en/contacto/>
- Security: `/.well-known/security.txt` → <mailto:jonathanmartinpaez@gmail.com>
