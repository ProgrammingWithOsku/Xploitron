export const xssPrompt = `Suggest 3 effective XSS payloads for testing login forms.
Return ONLY a valid JSON array like this:
["<script>alert(1)</script>", "<img src=x onerror=alert(2)>", "'><svg/onload=alert(3)>"]
No explanation, no formatting, just raw JSON.
`;