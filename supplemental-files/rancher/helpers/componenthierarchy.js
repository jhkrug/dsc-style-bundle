'use strict'

// Builds the component tree for partials/nav-explore.hbs from the partials named
// component-hierarchy.yml, in the latest version of any component. Each content
// repository can add one, for example in shared/modules/en/partials/.
// Antora loads helpers as virtual modules at <playbook dir>/ui-helpers/<name>.js,
// so require() finds js-yaml in the playbook node_modules.
//
// Without a file, the tree is the flat list of components. Components that no
// file names keep their place in that list. A file can name components that
// are not in the site.
//
//   {{#each (componenthierarchy site.components page.component)}}
//   {{componenthierarchy site.components page.component showVersion=true}}
//
// The second form tells whether the selector shows the version of the current page.
const CONFIG_NAME = 'component-hierarchy.yml'
const FLAT_CONFIG = { nodes: [], hidden: ['shared'] }

function findConfigFiles (contentCatalog) {
  if (!contentCatalog) return []
  return contentCatalog.findBy({ family: 'partial' }).filter(({ src }) =>
    src.basename === CONFIG_NAME && contentCatalog.getComponent(src.component)?.latest?.version === src.version)
}

function loadConfig (contentCatalog, parse = (text) => require('js-yaml').load(text)) {
  const configs = findConfigFiles(contentCatalog).map((file) => {
    const { component, version, module, relative } = file.src
    const source = `${CONFIG_NAME} in ${version}@${component}:${module}:partial$${relative}`
    return validateConfig(parse(file.contents.toString()), source)
  })
  return configs.length ? mergeConfigs(configs) : FLAT_CONFIG
}

// Many repositories can add a file. A component can appear in one file only.
function mergeConfigs (configs) {
  const owner = new Map()
  for (const config of configs) {
    for (const name of config.names) {
      if (owner.has(name)) throw new Error(`component hierarchy: ${name} is in ${owner.get(name)} and in ${config.source}`)
      owner.set(name, config.source)
    }
  }
  return {
    nodes: configs.flatMap((config) => config.nodes),
    hidden: [...new Set(configs.flatMap((config) => config.hidden))],
  }
}

function validateConfig (config, source = 'component hierarchy') {
  const fail = (message) => { throw new Error(`${source}: ${message}`) }
  if (!config || !Array.isArray(config.component_hierarchy)) fail('component_hierarchy must be a list')
  const hidden = config.hidden_components ?? []
  if (!Array.isArray(hidden)) fail('hidden_components must be a list')
  const seen = new Set()
  const check = (node, where) => {
    if (!node || typeof node.component !== 'string') fail(`${where}: component must be a string`)
    if (seen.has(node.component)) fail(`${where}: ${node.component} appears more than once`)
    seen.add(node.component)
    for (const key of ['expanded', 'include_versions']) {
      if (typeof node[key] !== 'boolean') fail(`${where} (${node.component}): ${key} must be true or false`)
    }
    if (node.title != null && typeof node.title !== 'string') fail(`${where} (${node.component}): title must be a string`)
    if (node.children != null && !Array.isArray(node.children)) fail(`${where} (${node.component}): children must be a list`)
    ;(node.children || []).forEach((child, i) => check(child, `${where}.children[${i}]`))
  }
  config.component_hierarchy.forEach((node, i) => check(node, `component_hierarchy[${i}]`))
  return { nodes: config.component_hierarchy, hidden, names: seen, source }
}

function flatNode (component, currentComponent) {
  return {
    component,
    name: component.name,
    title: component.title,
    includeVersions: true,
    expanded: false,
    isCurrent: component === currentComponent,
    containsCurrent: false,
    children: [],
  }
}

// Antora passes site.components to templates as an object keyed by name.
function buildTree (components, currentComponent, config) {
  const componentList = Array.isArray(components) ? components : Object.values(components || {})
  const byName = new Map(componentList.map((component) => [component.name, component]))
  const hidden = new Set(config.hidden)
  const rootOf = new Map()

  // Returns a list: a node that is not in the site gives its children to its parent.
  const resolve = (node) => {
    const component = byName.get(node.component)
    const children = (node.children || []).flatMap(resolve)
    if (!component) return children
    // A group without any of its children in the site is a plain component.
    if (node.children?.length && !children.length) return [flatNode(component, currentComponent)]
    const isCurrent = component === currentComponent
    const containsCurrent = children.some((child) => child.isCurrent || child.containsCurrent)
    return [{
      component,
      name: component.name,
      title: node.title || component.title,
      includeVersions: node.include_versions,
      expanded: children.length > 0 && (node.expanded || containsCurrent),
      isCurrent,
      containsCurrent,
      children,
    }]
  }

  const mark = (root, node) => {
    rootOf.set(node.name, root)
    node.children.forEach((child) => mark(root, child))
  }
  config.nodes.flatMap(resolve).forEach((root) => mark(root, root))

  // Keep the site order. A group takes the place of its first component.
  const tree = []
  const added = new Set()
  for (const component of componentList) {
    if (hidden.has(component.name)) continue
    const root = rootOf.get(component.name) || flatNode(component, currentComponent)
    if (added.has(root.name)) continue
    added.add(root.name)
    tree.push(root)
  }
  return tree
}

function findNode (nodes, component) {
  for (const node of nodes) {
    if (node.component === component) return node
    const found = findNode(node.children, component)
    if (found) return found
  }
}

const configs = new WeakMap()

module.exports = (components, currentComponent, options) => {
  // Handlebars passes its options object last.
  if (!options && currentComponent?.hash) [currentComponent, options] = [undefined, currentComponent]
  // Antora puts the content catalog in the root of the UI model, one for each build.
  const contentCatalog = options?.data?.root?.contentCatalog
  let config = contentCatalog ? configs.get(contentCatalog) : FLAT_CONFIG
  if (!config) configs.set(contentCatalog, (config = loadConfig(contentCatalog)))
  const tree = buildTree(components, currentComponent, config)
  if (options?.hash?.showVersion) return findNode(tree, currentComponent)?.includeVersions ?? true
  return tree
}

module.exports.loadConfig = loadConfig
module.exports.validateConfig = validateConfig
module.exports.mergeConfigs = mergeConfigs
module.exports.buildTree = buildTree
