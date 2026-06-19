"use strict";

const dprint = (...args) => {
	const debug = false;
	if (debug) console.log(...args);
};

const normalize = (url) => {
	if (!url) return null;

	const parts = url.split("?")[0].split("#")[0].split("/");
	if (parts.length > 3) parts.splice(3, 1);

	let normalized = parts.join("/");
	normalized = normalized.replace(/\/index\.html$/, "/");
	normalized = normalized.replace(/\/+$/, "/");

	return normalized;
};

module.exports = (pageurl, rooturl) => {
	if (!pageurl || !rooturl) return false;

	const pageRoot = normalize(pageurl);
	const componentRoot = normalize(rooturl);
	const result = pageRoot === componentRoot;

	dprint("isComponentRootPageForLang", pageurl, rooturl, result);
	return result;
};
