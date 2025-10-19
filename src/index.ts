import { runScan } from './core/engine';
import { queryLocalLLM } from './core/llama';
import { xssPrompt } from './payloads/xss.prompt';
import { TARGET_URL } from './core/config';

(async () => {
  const response = await queryLocalLLM(xssPrompt);

  let payloads: string[] = [];

  try {
    payloads = JSON.parse(response);
  } catch {
    console.warn('⚠️ Invalid JSON from LLM, falling back to raw response.');
    payloads = [response];
  }

  for (const payload of payloads) {
    await runScan({
      type: 'xss',
      target: TARGET_URL,
      payloads: [payload],
      llmResponse: response
    });
  }
})();