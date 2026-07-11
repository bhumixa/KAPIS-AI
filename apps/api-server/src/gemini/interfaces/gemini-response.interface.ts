import { GeminiContent } from './gemini-message.interface';
import { GeminiUsageMetadata } from './gemini-usage.interface';

export interface GeminiCandidate {
  content?: GeminiContent;
  finishReason?: string;
}

/** Field-for-field mirror of the Gemini API's generateContent response body. */
export interface GeminiResponse {
  candidates?: GeminiCandidate[];
  modelVersion?: string;
  usageMetadata?: GeminiUsageMetadata;
}
