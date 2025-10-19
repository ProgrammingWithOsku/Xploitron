import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { escapeHTML } from '../utils/sanitizer';
import { ReportData, AttackResult } from './types';

export function generateSecureReport(reportData: ReportData): void {
  const template = readFileSync('./src/layout/layout.html', 'utf-8');
  const cssStyles = readFileSync('./src/layout/layout.css', 'utf-8');
  const timestamp = new Date().toLocaleString('en-GB', { hour12: false });

  const attackRows = reportData.results.map((result: AttackResult) => {
    let statusClass = '';
    switch (result.status) {
      case 'Vulnerable ⚠️': statusClass = 'detected'; break;
      case 'Secure ✅': statusClass = 'clean'; break;
      case 'Error ❌': statusClass = 'failed'; break;
    }
    const safeUrl = escapeHTML(result.url);
    const safeSelector = escapeHTML(result.selector);
    const safePayload = escapeHTML(result.payload);

    return `
      <tr>
        <td>${escapeHTML(result.attackType)}</td>
        <td>${safeUrl}</td>
        <td class="selector">${safeSelector}</td>
        <td class="payload">${safePayload}</td>
        <td class="status ${statusClass}">${result.status}</td>
      </tr>
    `;
  }).join('\n');

  const filled = template
    .replace('{{styles}}', cssStyles)
    .replace('{{attackRows}}', attackRows)
    .replace('{{timestamp}}', timestamp)
    .replace('{{targetUrl}}', escapeHTML(reportData.target))
    .replace('{{llmResponse}}', escapeHTML(reportData.llmResponse || ''));

  const outputDir = './results';
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(`${outputDir}/report.html`, filled);
  console.log(`📄 Secure, detailed report saved to ${outputDir}/report.html`);
}