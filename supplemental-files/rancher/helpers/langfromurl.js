'use strict'

const get_lang = (url) => url.split('/')[3] || 'en';
const langToHreflangMapping = {
  "en": "en-US",
  "de": "de-DE",
  "fr": "fr-FR",
  "es": "es-ES",
  "ja": "ja-JP",
  "pt_br": "pt-BR",
  "zh": "zh-CN",
  "ko": "ko-KR",
}

module.exports = (pageurl, type, nav) => {
  if (nav.page.layout == '404') return null;
  const lang = get_lang(pageurl);
  if (type == 'hreflang') {
    const hreflang = langToHreflangMapping[lang];
    return hreflang;
  } else {
    return lang;
  }
}
