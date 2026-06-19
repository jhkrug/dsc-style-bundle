# Copilot Instructions

## Repository Purpose

This repository provides the **Antora UI supplemental files** for SUSE
documentation sites. It overrides specific assets from the base UI bundle
(`dsc-default-bundle/ui-bundle.zip`) on a per-product basis. The supplemental
files are referenced in Antora playbooks in separate documentation
repositories.

## Architecture

```
dsc-default-bundle/ui-bundle.zip   # Base Antora UI bundle (do not unzip here)
supplemental-files/
  rancher/                         # Cloud Native / Rancher docs (documentation.suse.com/cloudnative)
  mlm/
    susecom-2025/                  # SUSE main site variant
    webui-2025/                    # SUSE WebUI variant
```

Each product directory under `supplemental-files/` follows the same layout mirroring the Antora UI bundle structure:

| Path | Purpose |
|---|---|
| `layouts/*.hbs` | Page-level Handlebars templates (`default.hbs`, `404.hbs`) |
| `partials/*.hbs` | Handlebars partial templates included by layouts |
| `helpers/*.js` | Antora Handlebars helper functions (CommonJS `module.exports`) |
| `css/site-extra.css` | Product-specific CSS overrides layered on top of the base bundle |
| `js/` | JavaScript files injected into pages |
| `img/` | SVG/image assets |
| `fonts/` | Font files and Font Awesome metadata YAMLs |

Only files that differ from the base bundle need to exist here — missing files fall back to the base bundle.

## Generating the Site

To build a documentation site using these supplemental files, run from an Antora playbook repository that references this one:

```bash
antora antora-playbook.yml
```

To preview locally:

```bash
npm install -g http-server
http-server ./build/site
# visit http://localhost:8080
```

There are no build steps or tests within this repository itself.

## Key Conventions

### Handlebars Templates

- Layouts use Antora context variables: `page`, `site`, `env`, `uiRootPath`, `siteRootPath`.
- Partials are included with `{{> partial-name}}`.
- Custom helpers are called like any Handlebars helper: `{{helperName arg1 arg2}}`.
- The `langFromUrl` helper extracts the language code from the URL path (used in the `<html lang="...">` attribute and hreflang links).

### Helpers

- Written as plain Node.js CommonJS modules: `module.exports = (args...) => { ... }`.
- A `const debug = false` pattern is used for optional console logging — flip to `true` to enable debug output, but don't commit with `true`.

### Language Support

Supported locales: `en`, `de`, `fr`, `es`, `es-es`, `zh-cn`, `pt-br`, `ja`, `ko`.

Language-specific partials follow the naming pattern `partialname_<lang>.hbs` (e.g., `disclaimer_de.hbs`, `prerelease_zh-cn.hbs`). The base partial (e.g., `disclaimer.hbs`) dispatches to the correct language variant.

The `admonition-trans.txt` file in the repo root tracks translations for admonition labels (NOTE, TIP, WARNING, IMPORTANT, CAUTION) across supported languages — update it when adding new language support.

### Shared Header Web Component

The SUSE global navigation bar is a web component loaded from CloudFront CDN:

```html
<script type="module">
  import { defineCustomElements, setAssetPath } from 'https://d12w0ryu9hjsx8.cloudfront.net/shared-header/1.10/shared-header.esm.js';
  ...
</script>
```

The version number (`1.10`) in the CDN URL may need updating when the shared header releases new versions.

### CSS

- `site-extra.css` holds all product-specific overrides and is loaded after the base bundle CSS.
- SUSE brand colors: midnight `#0a112b`, dark green `#0c322c` / `#0a322c`, accent green `#00c081` / `#33ba78`.
- Font families: `SUSE` (variable weight sans-serif), `SUSE Mono`, `Poppins` (loaded from Google Fonts and `documentation.suse.com`).

### Rancher vs MLM Differences

The `rancher` set is the most feature-complete and adds:
- Full `layouts/` directory (mlm variants inherit layouts from the base bundle)
- Additional helpers: `hrefLang`, `langExistsFor`, `langFromUrl`, `projData`, `searchPlaceholderForLang`, `tocTitleForLang`
- Extra partials: `article.hbs`, `body.hbs`, `breadcrumbs.hbs`, `disclaimer*.hbs`, `prerelease*.hbs`, `toc.hbs`, `toolbar.hbs`, and navigation partials

MLM variants (`susecom-2025`, `webui-2025`) only override `partials/head-meta.hbs`, `partials/header-content.hbs`, and `partials/footer-scripts.hbs`.

### `tmp/` Directory

The `tmp/` directory is a scratch space for work-in-progress files and should
not be treated as part of the published supplemental files.
