const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'clip', 'clips', 'for', 'from', 'get', 'i', 'in', 'is', 'it',
  'me', 'my', 'need', 'of', 'on', 'or', 'our', 'some', 'that', 'the', 'their', 'this', 'to', 'video', 'videos',
  'want', 'we', 'with', 'few', 'seconds', 'find', 'show', 'looking', 'someone', 'people', 'person',
]);

export function normaliseQuery(query: string): string {
  return query.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function searchWords(text: string): string[] {
  return [
    ...new Set(
      text
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter((word) => word.length >= 2 && !STOP_WORDS.has(word)),
    ),
  ];
}
