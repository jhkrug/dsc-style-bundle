
# Antora Playbook with Default Theme and Product-Specific Supplemental Files

This repository demonstrates how to set up an Antora documentation site using the default D.S.C theme style bundle and additional product-specific supplemental files.

## Prerequisites

Before using this playbook, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [Antora CLI](https://docs.antora.org/) and the default site generator

To install Antora CLI globally, run:

```bash
npm install -g @antora/cli @antora/site-generator-default
```

## Repository Structure

```plaintext
.
├── antora-playbook.yml       # Main playbook for Antora
├── ui-bundle/
│   └── default-ui.zip        # Default Antora UI bundle (or custom version)
├── supplemental-files/
│   ├── product1/
│   │   └── logo.png          # Example product-specific file
│   └── product2/
│       └── custom.css        # Example product-specific CSS
└── README.md                 # This file
```

## Instructions

### 1. Clone the Repository
Clone this repository to your local machine:

```bash
git clone <repository-url>
cd <repository-name>
```

### 2. Add Content Sources
Ensure your playbook's `content` section specifies the repositories containing your documentation sources. For example:

```yaml
content:
  sources:
    - url: https://git.example.com/product1-docs.git
      branches: [main]
    - url: https://git.example.com/product2-docs.git
      branches: [main]
```

### 3. Add the Default Theme UI Bundle
Place the default Antora UI bundle (`default-ui.zip`) in the `ui-bundle/` directory. Alternatively, specify a remote UI bundle in the playbook:

```yaml
ui:
  bundle:
    url: https://example.com/path/to/default-ui.zip
```

### 4. Include Supplemental Files
To include supplemental files, ensure they are referenced correctly in your playbook. For example:

```yaml
site:
  start_page: product1::index.adoc
  title: Example Documentation Site
ui:
  supplemental_files:
    - path: supplemental-files/product1/logo.png
    - path: supplemental-files/product2/custom.css
```

### 5. Generate the Site
Run the following command to generate the site:

```bash
antora antora-playbook.yml
```

### 6. Serve the Site Locally
To preview the site locally, use a static file server like `http-server` or a similar tool:

```bash
npm install -g http-server
http-server ./build/site
```

Visit `http://localhost:8080` to view the site.

## Customizing the Theme
You can customize the default UI bundle by extracting it, making modifications, and repackaging it into a `.zip` file. Place the updated bundle in the `ui-bundle/` directory or host it remotely and update the playbook.

## Additional Notes

- Ensure supplemental files like custom stylesheets or images are compatible with the default UI theme structure.
- You can version-control product-specific files separately to maintain modularity.

## Troubleshooting

- If Antora fails to find your UI bundle, verify the `ui.bundle` path in the playbook.
- Ensure supplemental files are correctly specified and accessible in the playbook.

## References

- [Antora Documentation](https://docs.antora.org/)
- [Antora Default UI](https://gitlab.com/antora/antora-ui-default)