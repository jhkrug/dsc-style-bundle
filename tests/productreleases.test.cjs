'use strict'

// Run with: node --test tests/*.test.cjs
const { test } = require('node:test')
const assert = require('node:assert/strict')
const helper = require('../supplemental-files/rancher/helpers/productreleases.js')
const { loadProducts, validateConfig, resolveProduct, selectorEntries, pageContext, pageMenu } = helper

// Antora-like components. A version is { version, prerelease, url }.
const component = (name, title, ...versions) => {
  const list = versions.map((it) => (typeof it === 'string' ? { version: it } : it))
    .map((it) => ({ ...it, displayVersion: it.version, url: `/${name}/${it.version}/en/introduction.html` }))
  return { name, title, versions: list, latest: list.find((it) => !it.prerelease) || list[0] }
}
const site = () => [
  component('k3s', 'K3s', 'latest'),
  component('admission-controller', 'Admission Controller', { version: '1.39', prerelease: '-dev' }, '1.38', '1.37'),
  component('kubewarden', 'SUSE Security', '1.0'),
  component('network-enforcer', 'Network Enforcer', '0.4', '0.3'),
  component('shared', 'shared', 'latest'),
  component('rke2', 'RKE2', 'latest'),
]
const byName = (components) => new Map(components.map((it) => [it.name, it]))
const r600 = { version: '6.0.0', components: { 'admission-controller': '1.38', 'network-enforcer': '0.3' } }
const r601 = { version: '6.0.1', components: { 'admission-controller': '1.38', 'network-enforcer': '0.4' } }
const config = (...releases) => ({
  product: { component: 'kubewarden', landing_version: '1.0', url_prefix: 'suse-security' },
  releases,
})
const product = (components, ...releases) =>
  resolveProduct(validateConfig(config(...releases), 'test.yml', 'suse-security'), byName(components))
const find = (components, name) => components.find((it) => it.name === name)

test('the selector shows the product releases in the place of its first component', () => {
  const components = site()
  const ac = find(components, 'admission-controller')
  const entries = selectorEntries(components, [product(components, r601, r600)], ac, ac.versions[1])
  assert.deepEqual(entries.map((it) => (it.product ? it.title : it.component.name)), ['k3s', 'SUSE Security', 'rke2'])
  const [, suse] = entries
  assert.deepEqual(suse.releases.map((it) => [it.label, it.isCurrent, it.url]), [
    ['6.0.1', false, '/kubewarden/1.0/en/introduction.html'],
    ['6.0.0', true, '/kubewarden/1.0/en/introduction.html'],
  ])
  assert.equal(suse.isCurrent, true)
})

test('a release links to its own landing version when the extension registered one', () => {
  const components = site()
  find(components, 'kubewarden').versions.unshift(
    { version: '6.0.1', url: '/suse-security/6.0.1/en/introduction.html' },
    { version: '6.0.0', url: '/suse-security/6.0.0/en/introduction.html' })
  const kw = find(components, 'kubewarden')
  const entries = selectorEntries(components, [product(components, r601, r600)], kw, kw.versions[0])
  assert.deepEqual(entries[1].releases.map((it) => [it.label, it.isCurrent, it.url]), [
    ['6.0.1', true, '/suse-security/6.0.1/en/introduction.html'],
    ['6.0.0', false, '/suse-security/6.0.0/en/introduction.html'],
  ])
})

test('the release of a shared component version is its oldest release', () => {
  const components = site()
  const ac = find(components, 'admission-controller')
  const context = pageContext([product(components, r601, r600)], ac, ac.versions[1])
  assert.equal(context.label, '6.0.0')
  assert.equal(context.productTitle, 'SUSE Security')
  assert.equal(context.isLanding, false)
  const ne = find(components, 'network-enforcer')
  assert.equal(pageContext([product(components, r601, r600)], ne, ne.versions[0]).label, '6.0.1')
})

test('a page outside the product has no product context or menu', () => {
  const components = site()
  const k3s = find(components, 'k3s')
  const ac = find(components, 'admission-controller')
  const products = [product(components, r601, r600)]
  assert.equal(pageContext(products, k3s, k3s.versions[0]), '')
  assert.equal(pageMenu(products, k3s, k3s.versions[0], '/k3s/latest/en/x.html', []), '')
  // An unpinned version of a product component, in a build without the extension.
  assert.equal(pageContext(products, ac, ac.versions[2]), '')
})

test('the menu of a shared page links to the path of each release', () => {
  const components = site()
  const ac = find(components, 'admission-controller')
  const products = [product(components, r601, r600)]
  const url = '/suse-security/6.0.0/en/admission-controller/howtos/x.html'
  assert.deepEqual(pageMenu(products, ac, ac.versions[1], url, []), [
    { version: '6.0.1', label: '6.0.1', url: '/suse-security/6.0.1/en/admission-controller/howtos/x.html', missing: false, isCurrent: false },
    { version: '6.0.0', label: '6.0.0', url, missing: false, isCurrent: true },
  ])
  // Without the extension, the shared page has one URL.
  assert.deepEqual(pageMenu(products, ac, ac.versions[1], '/admission-controller/1.38/en/x.html', []).map((it) => it.url),
    ['/admission-controller/1.38/en/x.html', '/admission-controller/1.38/en/x.html'])
})

test('the menu links to the page in the pinned version of other releases', () => {
  const components = site()
  const ne = find(components, 'network-enforcer')
  const products = [product(components, r601, r600)]
  const pageVersions = [{ version: '0.4', url: '/ne/0.4/x.html' }, { version: '0.3', url: '/ne/0.3/', missing: true }]
  assert.deepEqual(pageMenu(products, ne, ne.versions[0], '/ne/0.4/x.html', pageVersions).map((it) => [it.label, it.url, it.missing, it.isCurrent]), [
    ['6.0.1', '/ne/0.4/x.html', false, true],
    ['6.0.0', '/ne/0.3/', true, false],
  ])
})

test('a release that pins a version that is not in the site stops the build', () => {
  const components = site()
  assert.throws(() => product(components, { version: '6.0.0', components: { 'admission-controller': '1.20' } }),
    /release 6.0.0 names admission-controller 1.20, which is not in the site/)
  assert.throws(() => product(components, { version: '6.0.0', components: { other: '1.0' } }), /names other 1.0, which is not in the site/)
})

test('a release that pins a prerelease must be a prerelease', () => {
  const components = site()
  const dev = { version: '6.1.0', components: { 'admission-controller': '1.39' } }
  assert.throws(() => product(components, dev), /names the prerelease admission-controller 1.39, so it must set prerelease: true/)
  const [release] = product(components, { ...dev, prerelease: true }).releases
  assert.equal(release.label, '6.1.0 (preview)')
})

test('validation rejects a bad configuration', () => {
  const bad = (change) => () => validateConfig(change(config(r600)), 'test.yml', 'p')
  assert.throws(bad(() => null), /must contain product and releases/)
  assert.throws(bad((c) => ({ ...c, extra: 1 })), /top level: unknown key extra/)
  assert.throws(bad((c) => ({ ...c, product: { ...c.product, colour: 'red' } })), /product: unknown key colour/)
  assert.throws(bad((c) => ({ ...c, product: { ...c.product, url_prefix: 'SUSE/Security' } })), /url_prefix must match/)
  assert.throws(bad((c) => ({ ...c, product: { ...c.product, landing_version: 1 } })), /landing_version must be a string/)
  assert.throws(bad((c) => ({ ...c, releases: [] })), /at least one release/)
  assert.throws(bad((c) => ({ ...c, releases: [r600, r600] })), /6.0.0 appears more than once/)
  assert.throws(bad((c) => ({ ...c, releases: [{ ...r600, version: '6.0/0' }] })), /version must be a string that matches/)
  assert.throws(bad((c) => ({ ...c, releases: [{ ...r600, notes: 'x' }] })), /releases\[0\]: unknown key notes/)
  assert.throws(bad((c) => ({ ...c, releases: [{ ...r600, components: { kubewarden: '1.0' } }] })), /kubewarden is the landing component/)
  assert.throws(bad((c) => ({ ...c, releases: [{ ...r600, components: { 'admission-controller': 1.38 } }] })), /must be a string/)
  assert.throws(bad((c) => ({ ...c, releases: [{ ...r600, prerelease: 'yes' }] })), /prerelease must be true or false/)
})

test('two products cannot share a component or a URL prefix', () => {
  const file = (component, basename, data) => ({
    src: { component, version: '1', module: 'en', relative: basename, basename },
    contents: Buffer.from(JSON.stringify(data)),
  })
  const catalog = (...files) => ({
    findBy: () => files,
    getComponent: () => ({ latest: { version: '1' } }),
  })
  const a = config(r600)
  const b = { product: { component: 'other', landing_version: '1', url_prefix: 'other' }, releases: [r600] }
  assert.throws(() => loadProducts(catalog(file('x', 'a-release-config.yml', a), file('y', 'b-release-config.yml', b)), JSON.parse),
    /admission-controller is in a-release-config.yml .* and in b-release-config.yml/)
  const c = { product: { component: 'other', landing_version: '1', url_prefix: 'suse-security' }, releases: [{ version: '1', components: { z: '1' } }] }
  assert.throws(() => loadProducts(catalog(file('x', 'a-release-config.yml', a), file('y', 'c-release-config.yml', c)), JSON.parse),
    /url_prefix suse-security is in/)
  assert.deepEqual(loadProducts(catalog(), JSON.parse), [])
  assert.deepEqual(loadProducts(catalog(file('x', 'notes.yml', {})), JSON.parse), [])
})
