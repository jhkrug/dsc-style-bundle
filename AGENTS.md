# AGENTS.md

This repository contains the Antora UI for SUSE product documentation.

## Layout

- `default-ui/ui-bundle.zip`: the Antora default UI bundle. Do not edit it.
- `supplemental-files/<product>/`: product files. Antora adds them to the bundle. A file with the same path as a bundle file replaces it.
- `tests/`: Node.js tests.
- `rancher-docs/`: notes on changes to `supplemental-files/rancher`.

## Rules

- Make changes in `supplemental-files/<product>/`, not in the bundle.
- Keep changes in one product unless the task is for more products.
- Run the tests before you commit: `node --test tests/*.test.cjs`.

## Documentation

- Write documentation in ASD-STE100 (Simplified Technical English).
- Write for humans and agents. Use short sentences and lists. Give only the necessary information.
- Refer to the code by file path and function name, not by line number.

## Rancher change notes

- [Copy button for console blocks](rancher-docs/copy-to-clipboard.md): `$ `, `# ` and `> ` prompts, continuation lines, heredocs.
- [Documentation survey link](rancher-docs/docsurvey.md): how to turn the link on and off.
