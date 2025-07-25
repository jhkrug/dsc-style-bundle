'use strict'

const get_project_code = (url) => url.split('/')[1] || null

module.exports = (nav, projectData) => {
  if (nav.page.layout == '404') return null;
  const project_code = get_project_code(nav.page.url);
  const dsc_url = projectData.find(obj => obj['url-part'] === project_code)?.url || null;
  return dsc_url;
}