import { MODEL_NAME } from './config';
import fetch from 'node-fetch';

/**
 * Sends a prompt to a local Ollama instance and returns the model's response.
 * @param prompt The prompt to send to the LLM.
 * @returns A promise that resolves to the LLM's response text.
 */
export async function queryLocalLLM(prompt: string): Promise<string> {
  console.log(`🤖 Sending prompt to local LLM (${MODEL_NAME})...`);
  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [{ role: 'user', content: prompt }],
        stream: false, // Ensure we get the full response at once
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API responded with status: ${response.status}`);
    }

    // The /api/chat endpoint returns a structured object
    const data = (await response.json()) as { message: { content: string } };
    return data.message.content.trim();
    
  } catch (error) {
    console.error("🔴 LLM Query Failed:", (error as Error).message);
    console.warn("⚠️  Falling back to mock payloads. Is your local Ollama server running?");
    // Fallback payloads if the LLM call fails
    const mockPayloads = [
      "<script>alert('xss-fallback')</script>",
      "<img src=x onerror=alert('xss-fallback')>",
    ];
    return JSON.stringify(mockPayloads);
  }
}