export const TEST_TAGS = {
  SMOKE: '@smoke',
  E2E: '@e2e',
  API: '@api',
  EXTERNAL: '@external',
  VISUAL: '@visual',
  STAGING: '@staging',
  RELEASE: '@release',
  PRODUCTION_SMOKE: '@production-smoke',
  READONLY: '@readonly',
} as const;

export type TestTag = typeof TEST_TAGS[keyof typeof TEST_TAGS];

export function getTagsForTestLevel(
  level: 'smoke' | 'e2e' | 'api' | 'external' | 'visual'
): TestTag[] {
  const tagMap: Record<string, TestTag[]> = {
    smoke: [TEST_TAGS.SMOKE],
    e2e: [TEST_TAGS.E2E],
    api: [TEST_TAGS.API],
    external: [TEST_TAGS.EXTERNAL],
    visual: [TEST_TAGS.VISUAL],
  };
  return tagMap[level] || [];
}

export function buildTagExpression(tags: string[]): string {
  return tags.join('|');
}
