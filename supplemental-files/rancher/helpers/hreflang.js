
'use strict'

const get_component = (url) => url.split('/')[1] || null
const get_version = (url) => url.split('/')[2] || null
const get_remainder = (url) => url.split('/').slice(4,).join('/') || null

module.exports = (pageurl, lang) => {

  const component = get_component(pageurl);
  const version = get_version(pageurl);
  const remainder = get_remainder(pageurl);

  return '/' + component + '/' + version +'/' + lang + '/' + remainder;
}