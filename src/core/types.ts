/** The specific type of attack being performed. */
export type AttackType = 'XSS' | 'SQLi';

/** The outcome of a single attack attempt. */
export interface AttackResult {
  attackType: AttackType;
  url: string;
  selector: string;
  payload: string;
  status: 'Vulnerable ⚠️' | 'Secure ✅' | 'Error ❌';
}

/** All data needed to generate one final report. */
export interface ReportData {
  target: string;
  results: AttackResult[];
  llmResponse?: string;
}