"use strict";
(() => {
  const $ = id => document.getElementById(id);
  const controls = ['book', 'range', 'paper', 'direction', 'perSheet'];
  let catalog = [], pages = [], title = '', token = 0, loadingBook = false;
  async function json(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error('おはなしを読み込めませんでした。');
    return response.json();
  }
  async function render() {
    if (loadingBook) return;
    const run = ++token;
    $('printBtn').disabled = true;
    $('preview').replaceChildren();
    try {
      if (!pages.length) throw new Error('印刷するページがありません。');
      const indices = EhonPrintLayout.parsePages($('range').value, pages.length);
      const plan = EhonPrintLayout.plan($('paper').value, $('direction').value, Number($('perSheet').value), indices);
      $('paperStyle').textContent = `@page { size: ${plan.width}mm ${plan.height}mm; margin: 0; }`;
      const images = [];
      for (const indices of plan.sheets) {
        const sheet = document.createElement('section');
        sheet.className = 'sheet';
        sheet.style.cssText = `--paper-width:${plan.width}mm;--paper-height:${plan.height}mm;--columns:${plan.columns};--rows:${plan.rows}`;
        for (const index of indices) {
          const cell = document.createElement('div'); cell.className = 'page';
          const img = document.createElement('img');
          img.alt = `${title} ${index + 1}ページ`;
          img.src = pages[index].image;
          cell.appendChild(img); sheet.appendChild(cell); images.push(img);
        }
        $('preview').appendChild(sheet);
      }
      $('status').textContent = '画像を準備しています…';
      await Promise.all(images.map(img => img.decode()));
      if (run !== token) return;
      $('status').textContent = `${indices.length}ページ → 用紙${plan.sheets.length}枚（${$('paper').value}・${$('direction').selectedOptions[0].textContent}）`;
      $('printBtn').disabled = false;
      document.title = title + ' — 印刷';
    } catch (error) {
      if (run !== token) return;
      $('status').textContent = error.name === 'EncodingError' ? '画像を読み込めませんでした。通信状態を確認してください。' : error.message;
    }
  }
  async function loadBook() {
    const run = ++token;
    loadingBook = true; pages = [];
    $('printBtn').disabled = true;
    $('preview').replaceChildren();
    $('status').textContent = 'おはなしを読み込んでいます…';
    try {
      const item = catalog[Number($('book').value)];
      const data = await json(item.data);
      if (run !== token) return;
      pages = data.pages || data; title = item.title;
      $('range').value = '';
      $('pageCount').textContent = `全${pages.length}ページ`;
      loadingBook = false;
      await render();
    } catch (error) { if (run === token) { loadingBook = false; $('status').textContent = error.message; } }
  }
  $('book').addEventListener('change', loadBook);
  for (const id of controls.filter(id => id !== 'book')) $(id).addEventListener('change', render);
  $('range').addEventListener('input', () => { $('printBtn').disabled = true; });
  $('printBtn').addEventListener('click', () => window.print());
  (async () => {
    try {
      catalog = (await json('./catalog.json')).filter(item => item.data);
      catalog.forEach((item, i) => { const option = document.createElement('option'); option.value = i; option.textContent = item.title; $('book').appendChild(option); });
      await loadBook();
    } catch (error) { $('status').textContent = error.message; }
  })();
})();
