// ==UserScript==
// @name         ChatGPT2Notion CleanPaste
// @namespace    https://violentmonkey.github.io/
// @version      0.2.0
// @description  ChatGPT2Notion CleanPaste: clean duplicated math text before pasting into Notion.
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @match        https://*.openai.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const LATEX_ANNOTATION_SELECTOR = 'annotation[encoding="application/x-tex"]';
  const DEBUG = false;

  function htmlEscape(text) {
    return text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function normalizeNewlines(text) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function logDebug(...args) {
    if (!DEBUG) return;
    console.log('[copy-fix]', ...args);
  }

  function getLatexFromKatexElement(el) {
    const ann = el.querySelector(LATEX_ANNOTATION_SELECTOR);
    if (ann && ann.textContent) return ann.textContent.trim();

    const dataLatex = el.getAttribute('data-latex');
    if (dataLatex) return dataLatex.trim();

    return '';
  }

  function isDisplayMath(node) {
    if (!node || !node.closest) return false;
    if (node.closest('.katex-display, .math-display')) return true;

    const mathLike = node.closest('math, mjx-container');
    if (!mathLike || !mathLike.getAttribute) return false;

    const display = mathLike.getAttribute('display');
    return display === 'block' || display === 'true';
  }

  function normalizeLatexForClipboard(latex) {
    if (!latex) return '';
    return latex
      .replace(/\r\n/g, '\n')
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]*\n[ \t]*/g, ' ')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
  }

  function replaceNodeWithLatex(node, latex, display) {
    if (!node || !latex) return;
    const normalizedLatex = normalizeLatexForClipboard(latex);
    if (!normalizedLatex) return;
    const wrapped = display ? `$$${normalizedLatex}$$` : `$${normalizedLatex}$`;
    const replacement = document.createElement('span');
    replacement.setAttribute('data-copied-math', '1');
    replacement.textContent = wrapped;
    node.replaceWith(replacement);
  }

  function replaceAnnotationMathWithLatex(container) {
    const annotations = container.querySelectorAll(LATEX_ANNOTATION_SELECTOR);
    const replacedTargets = new Set();

    annotations.forEach((ann) => {
      const latex = ann.textContent?.trim();
      if (!latex) return;

      const target =
        ann.closest('.katex') ||
        ann.closest('mjx-container') ||
        ann.closest('math') ||
        ann.closest('semantics');
      if (!target || replacedTargets.has(target)) return;

      replacedTargets.add(target);
      replaceNodeWithLatex(target, latex, isDisplayMath(target));
    });
  }

  function replaceMathNodesWithLatex(container) {
    const katexNodes = container.querySelectorAll('.katex');
    katexNodes.forEach((node) => {
      const latex = getLatexFromKatexElement(node);
      if (!latex) return;
      replaceNodeWithLatex(node, latex, isDisplayMath(node));
    });

    const mathjaxNodes = container.querySelectorAll('mjx-container');
    mathjaxNodes.forEach((node) => {
      const assistive = node.querySelector('mjx-assistive-mml annotation');
      const latex = assistive?.textContent?.trim();
      if (!latex) return;
      replaceNodeWithLatex(node, latex, isDisplayMath(node));
    });

    // Fallback: replace generic MathML annotation nodes when class names differ.
    replaceAnnotationMathWithLatex(container);

    // Remove duplicate-prone accessibility/math layers after extraction.
    container
      .querySelectorAll(
        [
          '[aria-hidden="true"]',
          '[hidden]',
          '.sr-only',
          '.visually-hidden',
          '[style*="display:none"]',
          '[style*="display: none"]',
          '[style*="visibility:hidden"]',
          '[style*="visibility: hidden"]',
          '.katex-mathml',
          'mjx-assistive-mml',
          'math',
          'semantics',
          'annotation',
          'mrow',
          'msup',
          'msub',
          'mi',
          'mn',
          'mo',
        ].join(', ')
      )
      .forEach((n) => {
        n.remove();
      });
  }

  function pickBestText(cleanText, renderedText) {
    if (!renderedText) return cleanText;
    if (!cleanText) return renderedText;

    // If detached-DOM extraction looks bloated, fallback to rendered selection text.
    if (cleanText.length > renderedText.length * 1.7) return renderedText;
    return cleanText;
  }

  function selectionToCleanText(selection) {
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return '';

    const wrapper = document.createElement('div');

    for (let i = 0; i < selection.rangeCount; i += 1) {
      const frag = selection.getRangeAt(i).cloneContents();
      wrapper.appendChild(frag);
      if (i < selection.rangeCount - 1) {
        wrapper.appendChild(document.createElement('br'));
      }
    }

    replaceMathNodesWithLatex(wrapper);

    // Preserve line breaks for common block elements before text extraction.
    wrapper.querySelectorAll('p, div, li, pre, h1, h2, h3, h4, h5, h6, tr').forEach((el) => {
      if (el.lastChild && el.lastChild.nodeName !== 'BR') {
        el.appendChild(document.createElement('br'));
      }
    });

    const cleanText = normalizeNewlines(wrapper.innerText || wrapper.textContent || '');
    const renderedText = normalizeNewlines(selection.toString() || '');
    return pickBestText(cleanText, renderedText);
  }

  function toSimpleHtmlFromText(text) {
    const escaped = htmlEscape(text);
    return escaped.replace(/\n/g, '<br>');
  }

  document.addEventListener(
    'copy',
    (event) => {
      const selection = window.getSelection();
      const cleanText = selectionToCleanText(selection);
      if (!cleanText) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      event.clipboardData?.clearData();
      event.clipboardData?.setData('text/plain', cleanText);
      event.clipboardData?.setData('text/html', toSimpleHtmlFromText(cleanText));
      logDebug('copy text =>', cleanText);
    },
    true
  );

  document.addEventListener(
    'cut',
    (event) => {
      const selection = window.getSelection();
      const cleanText = selectionToCleanText(selection);
      if (!cleanText) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      event.clipboardData?.clearData();
      event.clipboardData?.setData('text/plain', cleanText);
      event.clipboardData?.setData('text/html', toSimpleHtmlFromText(cleanText));
      logDebug('cut text =>', cleanText);
    },
    true
  );
})();
