# ADR-010: The site is static files on GitHub Pages, with all state in the browser

The application builds to plain static files, and nothing about a visitor is kept anywhere but their browser. There is no backend, no rendering at request time and no accounts. It is hosted on GitHub Pages for now, and a dedicated place may come later, so nothing may depend on Pages beyond a base path set at build time.

Production and pull request previews both deploy to the `gh-pages` branch. Each pull request gets a preview at `/pr-preview/pr-N/`, through pr-preview-action, which removes it when the pull request closes. A package script also previews a build locally.

The application needs no state outside the browser, so a server would only add something to run and secure. A preview on a sub page lets a change be reviewed without the checkout, including from a phone.

## Not chosen

- **Cloudflare Pages**: Its preview links are built in, but it needs another account at a stage where GitHub Pages is easier.
- **`actions/deploy-pages`**: Its `preview` input is marked alpha and not available to the public, so previews could not share a site with production.
- **Local previews only**: A review would need the checkout and the maintainer's machine.
