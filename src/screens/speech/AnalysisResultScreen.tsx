/**
 * AnalysisResultScreen — barrel re-export stub
 *
 * The analysis result flow is split across 9 screens in analysisResult/.
 * This stub re-exports TranscriptResultScreen as the canonical entry point
 * so that any import of `AnalysisResultScreen` lands at the first step of
 * the result flow. The SpeechStack navigates directly into each step by name,
 * so this file is only here to satisfy the barrel export in speech/index.
 */
export { default } from './analysisResult/TranscriptResultScreen';
