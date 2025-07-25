'use strict'

const get_project_code = (url) => url.split('/')[1] || null

module.exports = (request, nav, projectData) => {
  if (nav.page.layout == '404') return null;
  const project_code = get_project_code(nav.page.url);
  var ret = null;
  switch(request) {
    case 'title':
      ret = projectData.find(obj => obj['url-part'] === project_code)?.title || null;
      break;
    case 'url':
      ret = projectData.find(obj => obj['url-part'] === project_code)?.url || null;
      break;
    default:
      ret = null;
  }
  return ret;
}