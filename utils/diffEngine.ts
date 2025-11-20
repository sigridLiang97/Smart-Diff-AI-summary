import { DiffPart } from '../types';

/**
 * Tokenizes text into meaningful units for diffing.
 * - English/Numbers: Grouped as words (e.g., "Hello", "123").
 * - Chinese/CJK: Split individually (e.g., "你", "好").
 * - Whitespace: Grouped (preserves formatting).
 * - Punctuation: Grouped.
 */
const tokenize = (text: string): string[] => {
  if (!text) return [];
  // Regex breakdown:
  // 1. [a-zA-Z0-9_]+ : Alphanumeric words (English-like) - grouped as one token
  // 2. [\u4e00-\u9fa5] : CJK Unified Ideographs (standard Chinese range) - match individually
  // 3. \s+ : Whitespace sequences (newlines, spaces) - grouped
  // 4. [^a-zA-Z0-9_\s\u4e00-\u9fa5]+ : Punctuation and other symbols - grouped
  const regex = /[a-zA-Z0-9_]+|[\u4e00-\u9fa5]|\s+|[^a-zA-Z0-9_\s\u4e00-\u9fa5]+/g;
  return text.match(regex) || [];
};

/**
 * A simplified Myers Diff algorithm / LCS implementation to find differences between two strings.
 * Optimised for word-level diffing (English) and character-level diffing (Chinese).
 */
export const computeDiff = (oldText: string, newText: string): DiffPart[] => {
  // Tokenize the input strings instead of splitting by character
  const oldTokens = tokenize(oldText);
  const newTokens = tokenize(newText);
  
  const N = oldTokens.length;
  const M = newTokens.length;
  
  // LCS Matrix
  // We build a matrix based on the number of tokens.
  const lcsMatrix = Array(N + 1).fill(null).map(() => Array(M + 1).fill(0));
  
  for (let i = 1; i <= N; i++) {
    for (let j = 1; j <= M; j++) {
      if (oldTokens[i - 1] === newTokens[j - 1]) {
        lcsMatrix[i][j] = lcsMatrix[i - 1][j - 1] + 1;
      } else {
        lcsMatrix[i][j] = Math.max(lcsMatrix[i - 1][j], lcsMatrix[i][j - 1]);
      }
    }
  }
  
  // Backtrack to generate diff
  let i = N;
  let j = M;
  const parts: DiffPart[] = [];
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldTokens[i - 1] === newTokens[j - 1]) {
      parts.unshift({ value: oldTokens[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || lcsMatrix[i][j - 1] >= lcsMatrix[i - 1][j])) {
      parts.unshift({ value: newTokens[j - 1], added: true });
      j--;
    } else if (i > 0 && (j === 0 || lcsMatrix[i][j - 1] < lcsMatrix[i - 1][j])) {
      parts.unshift({ value: oldTokens[i - 1], removed: true });
      i--;
    }
  }
  
  // Merge adjacent parts of the same type to reduce DOM elements
  const mergedParts: DiffPart[] = [];
  if (parts.length > 0) {
    let current = parts[0];
    for (let k = 1; k < parts.length; k++) {
      const next = parts[k];
      if (
        (current.added === next.added) && 
        (current.removed === next.removed)
      ) {
        current.value += next.value;
      } else {
        mergedParts.push(current);
        current = next;
      }
    }
    mergedParts.push(current);
  }
  
  return mergedParts;
};