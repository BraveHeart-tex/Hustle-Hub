import { describe, expect, it } from 'vitest';

import { extractFerelId } from '@/lib/utils/misc/extractFerelId';

describe('extractFerelId', () => {
  it('reads a FEREL key from description text', () => {
    expect(extractFerelId('Release tracking: FEREL-42')).toBe('FEREL-42');
  });

  it('does not turn a missing description into a key', () => {
    expect(extractFerelId(null)).toBeNull();
  });
});
