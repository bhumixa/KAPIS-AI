/** Field-for-field mirror of the Gemini API's `usageMetadata` object. */
export interface GeminiUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}
