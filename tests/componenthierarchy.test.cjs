'use strict'

// Run with: node --test tests/*.test.cjs
const { test } = require('node:test')
const assert = require('node:assert/strict')
const helper = require('../supplemental-files/rancher/helpers/componenthierarchy.js')
const { buildTree, validateConfig, loadConfig } = helper

const component = (name) => ({ name, title: name.toUpperCase(), versions: [] })
const site = (...names) => Object.fromEntries(names.map((name) => [name, component(name)]))
const node = (name, extra = {}) => ({ component: name, expanded: false, include_versions: true, ...extra })
const config = (nodes, hidden = ['shared']) => validateConfig({ component_hierarchy: nodes, hidden_components: hidden })
const names = (tree) => tree.map((n) => n.children.length ? [n.name, names(n.children)] : n.name)

const kwConfig = config([node('kw', { include_versions: false, children: [node('ac'), node('sbom')] })])

// A content catalog with partials. Each file: [component, version, relative, contents].
// Latest versions: the first version given for each component. JSON is valid YAML.
const catalog = (...files) => {
  const latest = {}
  for (const [component, version] of files) latest[component] ??= version
  return {
    findBy: ({ family }) => family !== 'partial' ? [] : files.map(([component, version, relative, contents]) => ({
      src: { component, version, module: 'en', relative, basename: relative.split('/').pop() },
      contents: Buffer.from(JSON.stringify(contents)),
    })),
    getComponent: (name) => ({ latest: { version: latest[name] } }),
  }
}
const load = (...files) => loadConfig(catalog(...files), JSON.parse)
const file = (nodes, hidden) => ({ component_hierarchy: nodes, ...(hidden && { hidden_components: hidden }) })

test('no file gives the flat list without shared', () => {
  for (const flat of [load(), load(['a', '1', 'other.yml', {}]), loadConfig(undefined)]) {
    assert.deepEqual(names(buildTree(site('a', 'shared', 'b'), undefined, flat)), ['a', 'b'])
  }
})

test('the files of all components are merged', () => {
  const merged = load(
    ['shared', '', 'product-specific/component-hierarchy.yml', file([node('kw', { children: [node('ac')] })], ['shared'])],
    ['rancher', '2.9', 'component-hierarchy.yml', file([node('rancher', { children: [node('fleet')] })], ['old'])])
  const tree = buildTree(site('rancher', 'fleet', 'kw', 'ac', 'old', 'shared'), undefined, merged)
  assert.deepEqual(names(tree), [['rancher', ['fleet']], ['kw', ['ac']]])
})

test('only the latest version of a component counts', () => {
  const merged = load(
    ['kw', '2.0', 'component-hierarchy.yml', file([node('kw', { children: [node('ac')] })])],
    ['kw', '1.0', 'component-hierarchy.yml', file([node('kw', { children: [node('ac')] })])])
  assert.equal(merged.nodes.length, 1)
})

test('a component in two files stops the build', () => {
  assert.throws(() => load(
    ['a', '1', 'component-hierarchy.yml', file([node('x')])],
    ['b', '1', 'component-hierarchy.yml', file([node('x')])]), /x is in .*1@a.* and in .*1@b/)
})

test('a group takes the place of its first component in the site order', () => {
  const tree = buildTree(site('rancher', 'ac', 'kw', 'rke2', 'sbom', 'shared'), undefined, kwConfig)
  assert.deepEqual(names(tree), ['rancher', ['kw', ['ac', 'sbom']], 'rke2'])
})

test('a listed component that is not in the site is skipped', () => {
  const tree = buildTree(site('kw', 'ac'), undefined, kwConfig)
  assert.deepEqual(names(tree), [['kw', ['ac']]])
})

test('a group without children in the site is a plain component with versions', () => {
  const [kw] = buildTree(site('kw', 'other'), undefined, kwConfig)
  assert.equal(kw.name, 'kw')
  assert.equal(kw.includeVersions, true)
  assert.deepEqual(kw.children, [])
})

test('the children of a missing group move up a level', () => {
  const tree = buildTree(site('ac', 'sbom'), undefined, kwConfig)
  assert.deepEqual(names(tree), ['ac', 'sbom'])
})

test('a group opens when it contains the current component', () => {
  const components = site('kw', 'ac', 'sbom')
  const closed = config([node('kw', { children: [node('ac'), node('sbom')] })])
  assert.equal(buildTree(components, undefined, closed)[0].expanded, false)
  const [kw] = buildTree(components, components.ac, closed)
  assert.equal(kw.expanded, true)
  assert.equal(kw.containsCurrent, true)
  assert.equal(kw.children[0].isCurrent, true)
})

test('validation rejects bad configuration', () => {
  assert.throws(() => validateConfig({}), /component_hierarchy must be a list/)
  assert.throws(() => config([{ component: 'a', include_versions: true }]), /expanded must be true or false/)
  assert.throws(() => config([node('a'), node('a')]), /appears more than once/)
  assert.throws(() => config([node('a', { children: 'b' })]), /children must be a list/)
})
