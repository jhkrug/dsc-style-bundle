# Documentation survey link

The survey link is off.

## Code

- [`supplemental-files/rancher/partials/docsurvey.hbs`](../supplemental-files/rancher/partials/docsurvey.hbs) contains the link. The link is in a Handlebars comment (`{{!-- --}}`). Handlebars removes the comment, so the HTML output has no link.
- [`supplemental-files/rancher/partials/toc.hbs`](../supplemental-files/rancher/partials/toc.hbs) includes the partial two times:
  - In the "On this page" sidebar.
  - In a fallback sidebar (`docsurvey-sidebar`) for pages without sections.
- [`supplemental-files/rancher/css/site-extra.css`](../supplemental-files/rancher/css/site-extra.css) shows only one of the two. Search for `docsurvey`.

## Turn the link on or off

- To turn the link on, remove `{{!--` and `--}}` in `docsurvey.hbs`.
- To turn the link off, put the link in `{{!--` and `--}}`. Do not use an HTML comment (`<!-- -->`). An HTML comment stays in the output.

## Known issue

The fallback sidebar is in the output when the link is off. On small screens, pages without sections can show an empty space at the top. To remove it, also put the fallback `<aside>` in `toc.hbs` in a Handlebars comment.

## Other Qualtrics items

The survey link is not the Qualtrics feedback widget. The widget is still on:

- [`supplemental-files/rancher/js/qualtrics.js`](../supplemental-files/rancher/js/qualtrics.js), loaded in `partials/head-meta.hbs`.
- The `ZN_8qZUmklKYbBqAYe` and `qualtrics_container` elements in `toc.hbs`.
