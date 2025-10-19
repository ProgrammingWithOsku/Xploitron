export interface ScanTask {
  type: string;
  target: string;
  payloads: string[];
  llmResponse?: string;
}

export interface ScanResult {
  xssDetected: boolean;
  triedSelectors: string[];
}