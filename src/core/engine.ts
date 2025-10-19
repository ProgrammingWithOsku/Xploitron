import { readFileSync, writeFileSync } from 'fs';
import { runXSSScan } from '../modules/xss';
import { ScanTask, ScanResult } from './types';

export async function runScan(task: ScanTask) {
  const template = readFileSync('./src/layout/layout.html', 'utf-8');
  const timestamp = new Date().toLocaleString();

  const attackRows: string[] = [];

  for (const payload of task.payloads) {
    const result: ScanResult = await runXSSScan(task.target, payload);

    const safePayload = payload.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const statusText = result.xssDetected ? 'XSS Detected ⚠️' : 'No XSS Found ✅';
    const statusClass = result.xssDetected ? 'detected' : 'clean';

    attackRows.push(`
      <tr>
        <td>${task.type.toUpperCase()}</td>
        <td>${task.target}</td>
        <td class="payload">${safePayload}</td>
        <td class="status ${statusClass}">${statusText}</td>
      </tr>
    `);
  }

  const selectorList = task.payloads.map(p => `<li>${p}</li>`).join('\n');

  const filled = template
    .replace('{{attackRows}}', attackRows.join('\n'))
    .replace('{{llmResponse}}', (task.llmResponse || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'))
    .replace('{{timestamp}}', timestamp)
    .replace('{{selectorList}}', selectorList);

  writeFileSync('./results/report.html', filled);
  console.log('📄 Report saved to results/report.html');
}