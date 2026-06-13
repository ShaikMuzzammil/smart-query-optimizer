import natural from 'natural';

export const STOPWORDS = new Set([
  'a','about','above','after','again','against','all','am','an','and','any','are','as','at',
  'be','because','been','before','being','below','between','both','but','by','could','did',
  'do','does','doing','down','during','each','few','for','from','further','had','has','have',
  'having','he','her','here','hers','herself','him','himself','his','how','i','if','in','into',
  'is','it','its','itself','just','me','more','most','my','myself','no','nor','not','now','of',
  'off','on','once','only','or','other','our','ours','ourselves','out','over','own','same','she',
  'should','so','some','such','than','that','the','their','theirs','them','themselves','then',
  'there','these','they','this','those','through','to','too','under','until','up','very','was',
  'we','were','what','when','where','which','while','who','whom','why','will','with','you',
  'your','yours','yourself','yourselves',
]);

/**
 * Splits text into lowercase alphanumeric tokens.
 */
export function tokenize(text: string): string[] {
  if (!text) return [];
  return (text.toLowerCase().match(/[a-z0-9]+(?:'[a-z]+)?/g) || []).filter((t) => t.length > 0);
}

/**
 * Tokenize and remove stopwords - used for indexing & keyword extraction.
 */
export function tokenizeMeaningful(text: string, removeStopwords = true): string[] {
  const tokens = tokenize(text);
  if (!removeStopwords) return tokens;
  return tokens.filter((t) => !STOPWORDS.has(t) && t.length > 1);
}

/**
 * Porter2 stemming via `natural`.
 */
export function stem(word: string): string {
  try {
    return natural.PorterStemmer.stem(word);
  } catch {
    return word;
  }
}

export function stemTokens(tokens: string[]): string[] {
  return tokens.map(stem);
}

/**
 * Levenshtein edit distance - used by the query optimizer for "did you mean" spell correction.
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  const matrix: number[][] = Array.from({ length: al + 1 }, () => new Array(bl + 1).fill(0));
  for (let i = 0; i <= al; i++) matrix[i][0] = i;
  for (let j = 0; j <= bl; j++) matrix[0][j] = j;

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return matrix[al][bl];
}

/**
 * Computes basic Flesch-Kincaid and Coleman-Liau readability scores.
 */
export function computeReadability(text: string): {
  fleschKincaid: number;
  colemanLiau: number;
  gradeLevel: string;
} {
  const sentences = (text.match(/[.!?]+/g) || []).length || 1;
  const words = tokenize(text);
  const wordCount = words.length || 1;
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const letters = words.reduce((sum, w) => sum + w.length, 0);

  // Flesch-Kincaid Grade Level
  const fk = 0.39 * (wordCount / sentences) + 11.8 * (syllables / wordCount) - 15.59;

  // Coleman-Liau Index
  const L = (letters / wordCount) * 100;
  const S = (sentences / wordCount) * 100;
  const cli = 0.0588 * L - 0.296 * S - 15.8;

  const avgGrade = (fk + cli) / 2;
  let gradeLevel = 'Graduate';
  if (avgGrade <= 5) gradeLevel = 'Elementary';
  else if (avgGrade <= 8) gradeLevel = 'Middle School';
  else if (avgGrade <= 12) gradeLevel = 'High School';
  else if (avgGrade <= 16) gradeLevel = 'College';

  return {
    fleschKincaid: Math.round(fk * 10) / 10,
    colemanLiau: Math.round(cli * 10) / 10,
    gradeLevel,
  };
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}
