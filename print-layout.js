"use strict";
const EhonPrintLayout = {
  sizes: { A3: [297, 420], A4: [210, 297], A5: [148, 210], B5: [182, 257] },
  parsePages(value, count) {
    value = value.trim().replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/[、，]/g, ',').replace(/[〜～–－]/g, '-');
    if (!value) return Array.from({ length: count }, (_, i) => i);
    const selected = new Set();
    for (const part of value.split(',')) {
      const match = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
      if (!match) throw new Error('ページは「1-4, 7, 8」のように入力してください。');
      const start = Number(match[1]), end = Number(match[2] || match[1]);
      if (start < 1 || end > count || end < start) throw new Error(`ページは1〜${count}の範囲で指定してください。`);
      for (let p = start; p <= end; p++) selected.add(p - 1);
    }
    return [...selected].sort((a, b) => a - b);
  },
  plan(paper, direction, perSheet, indices) {
    if (!this.sizes[paper] || !['portrait', 'landscape'].includes(direction) || ![1, 2, 4].includes(perSheet)) throw new Error('印刷設定を確認してください。');
    const [short, long] = this.sizes[paper];
    const width = direction === 'portrait' ? short : long;
    const height = direction === 'portrait' ? long : short;
    const columns = perSheet === 4 || (perSheet === 2 && direction === 'landscape') ? 2 : 1;
    const sheets = [];
    for (let i = 0; i < indices.length; i += perSheet) sheets.push(indices.slice(i, i + perSheet));
    return { width, height, columns, rows: perSheet / columns, sheets };
  }
};
if (typeof module !== 'undefined') module.exports = EhonPrintLayout;
