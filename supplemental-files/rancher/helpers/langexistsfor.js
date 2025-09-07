
'use strict'

module.exports = (lang, languages) => {
  if (languages) {
    const arr = languages.replace(/[\[\]\s]/g, '').toLowerCase().split(',');
    return arr.includes(lang.toLowerCase());
  }
  return false;
}
