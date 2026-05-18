/**
 * Utility to normalize text prompts (especially Vietnamese/English inputs)
 * to save Gemini/OpenAI prompt tokens and optimize quota.
 */
export function normalizeTextPrompt(prompt: string): string {
  if (!prompt) return '';
  return prompt
    .trim()
    .replace(/[^\S\r\n]+/g, ' ') // Collapse multiple spaces/tabs into a single space
    .replace(/(?:\r?\n\s*){2,}/g, '\n') // Collapse consecutive blank lines into a single newline
    .slice(0, 2000); // Limit to 2000 characters to avoid excessive quota usage
}
