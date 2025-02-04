/*
 * Copyright 2010-2020 Gildas Lormeau
 * contact : gildas.lormeau <at> gmail.com
 * 
 * This file is part of SingleFile.
 *
 *   The code in this file is free software: you can redistribute it and/or 
 *   modify it under the terms of the GNU Affero General Public License 
 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
 *   of the License, or (at your option) any later version.
 * 
 *   The code in this file is distributed in the hope that it will be useful, 
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
 *   General Public License for more details.
 *
 *   As additional permission under GNU AGPL version 3 section 7, you may 
 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
 *   AGPL normally required by section 4, provided you include this license 
 *   notice and a URL through which recipients can access the Corresponding 
 *   Source.
 */

/* global globalThis, window */

const LOAD_DEFERRED_IMAGES_START_EVENT = "single-file-load-deferred-images-start";
const LOAD_DEFERRED_IMAGES_END_EVENT = "single-file-load-deferred-images-end";
const LOAD_DEFERRED_IMAGES_KEEP_ZOOM_LEVEL_START_EVENT = "single-file-load-deferred-images-keep-zoom-level-start";
const LOAD_DEFERRED_IMAGES_KEEP_ZOOM_LEVEL_END_EVENT = "single-file-load-deferred-images-keep-zoom-level-end";
const LOAD_DEFERRED_IMAGES_RESET_ZOOM_LEVEL_EVENT = "single-file-load-deferred-images-keep-zoom-level-reset";
const LOAD_DEFERRED_IMAGES_RESET_EVENT = "single-file-load-deferred-images-reset";
const BLOCK_COOKIES_START_EVENT = "single-file-block-cookies-start";
const BLOCK_COOKIES_END_EVENT = "single-file-block-cookies-end";
const BLOCK_STORAGE_START_EVENT = "single-file-block-storage-start";
const BLOCK_STORAGE_END_EVENT = "single-file-block-storage-end";
const LOAD_IMAGE_EVENT = "single-file-load-image";
const IMAGE_LOADED_EVENT = "single-file-image-loaded";
const NEW_FONT_FACE_EVENT = "single-file-new-font-face";

const browser = globalThis.browser;
const addEventListener = (type, listener, options) => globalThis.addEventListener(type, listener, options);
const dispatchEvent = event => globalThis.dispatchEvent(event);
const CustomEvent = globalThis.CustomEvent;
const document = globalThis.document;
const HTMLDocument = globalThis.HTMLDocument;
const Blob = globalThis.Blob;

let fontFaces;
if (window._singleFile_fontFaces) {
	fontFaces = window._singleFile_fontFaces;
} else {
	fontFaces = window._singleFile_fontFaces = [];
}

if (document instanceof HTMLDocument) {
	if (browser && browser.runtime && browser.runtime.getURL) {
		addEventListener(NEW_FONT_FACE_EVENT, event => {
			const detail = event.detail;
			if (!fontFaces.find(fontFace => JSON.stringify(fontFace) == JSON.stringify(detail))) {
				fontFaces.push(event.detail);
			}
		});
		let scriptElement = document.createElement("script");
		scriptElement.textContent = "(" + injectedScript.toString() + ")()";
		(document.documentElement || document).appendChild(scriptElement);
		scriptElement.remove();
		scriptElement = document.createElement("script");
		scriptElement.src = browser.runtime.getURL("/dist/web/hooks/hooks-frames-web.js");
		scriptElement.async = false;
		(document.documentElement || document).appendChild(scriptElement);
		scriptElement.remove();
	}
}

export {
	getFontsData,
	loadDeferredImagesStart,
	loadDeferredImagesEnd,
	loadDeferredImagesResetZoomLevel,
	LOAD_IMAGE_EVENT,
	IMAGE_LOADED_EVENT
};

function getFontsData() {
	return fontFaces;
}

function loadDeferredImagesStart(options) {
	if (options.loadDeferredImagesBlockCookies) {
		dispatchEvent(new CustomEvent(BLOCK_COOKIES_START_EVENT));
	}
	if (options.loadDeferredImagesBlockStorage) {
		dispatchEvent(new CustomEvent(BLOCK_STORAGE_START_EVENT));
	}
	if (options.loadDeferredImagesKeepZoomLevel) {
		dispatchEvent(new CustomEvent(LOAD_DEFERRED_IMAGES_KEEP_ZOOM_LEVEL_START_EVENT));
	} else {
		dispatchEvent(new CustomEvent(LOAD_DEFERRED_IMAGES_START_EVENT));
	}
}

function loadDeferredImagesEnd(options) {
	if (options.loadDeferredImagesBlockCookies) {
		dispatchEvent(new CustomEvent(BLOCK_COOKIES_END_EVENT));
	}
	if (options.loadDeferredImagesBlockStorage) {
		dispatchEvent(new CustomEvent(BLOCK_STORAGE_END_EVENT));
	}
	if (options.loadDeferredImagesKeepZoomLevel) {
		dispatchEvent(new CustomEvent(LOAD_DEFERRED_IMAGES_KEEP_ZOOM_LEVEL_END_EVENT));
	} else {
		dispatchEvent(new CustomEvent(LOAD_DEFERRED_IMAGES_END_EVENT));
	}
}

function loadDeferredImagesResetZoomLevel(options) {
	if (options.loadDeferredImagesKeepZoomLevel) {
		dispatchEvent(new CustomEvent(LOAD_DEFERRED_IMAGES_RESET_ZOOM_LEVEL_EVENT));
	} else {
		dispatchEvent(new CustomEvent(LOAD_DEFERRED_IMAGES_RESET_EVENT));
	}
}

function injectedScript() {
	if (typeof globalThis == "undefined") {
		window.globalThis = window;
	}
	const console = globalThis.console;
	const dispatchEvent = event => globalThis.dispatchEvent(event);
	const CustomEvent = globalThis.CustomEvent;
	const FileReader = globalThis.FileReader;
	const warn = (console && console.warn && ((...args) => console.warn(...args))) || (() => { });
	const NEW_FONT_FACE_EVENT = "single-file-new-font-face";
	const FONT_STYLE_PROPERTIES = {
		family: "font-family",
		style: "font-style",
		weight: "font-weight",
		stretch: "font-stretch",
		unicodeRange: "unicode-range",
		variant: "font-variant",
		featureSettings: "font-feature-settings"
	};

	if (globalThis.FontFace) {
		const FontFace = globalThis.FontFace;
		let warningFontFaceDisplayed;
		globalThis.FontFace = function () {
			if (!warningFontFaceDisplayed) {
				warn("SingleFile is hooking the FontFace constructor to get font URLs."); // eslint-disable-line no-console
				warningFontFaceDisplayed = true;
			}
			const detail = {};
			detail["font-family"] = arguments[0];
			detail.src = arguments[1];
			const descriptors = arguments[2];
			if (descriptors) {
				Object.keys(descriptors).forEach(descriptor => {
					if (FONT_STYLE_PROPERTIES[descriptor]) {
						detail[FONT_STYLE_PROPERTIES[descriptor]] = descriptors[descriptor];
					}
				});
			}
			if (detail.src instanceof ArrayBuffer) {
				const reader = new FileReader();
				reader.readAsDataURL(new Blob([detail.src]));
				reader.addEventListener("load", () => {
					detail.src = "url(" + reader.result + ")";
					dispatchEvent(new CustomEvent(NEW_FONT_FACE_EVENT, { detail }));
				});
			} else {
				dispatchEvent(new CustomEvent(NEW_FONT_FACE_EVENT, { detail }));
			}
			return new FontFace(...arguments);
		};
		globalThis.FontFace.toString = function () { return "function FontFace() { [native code] }"; };
	}
}