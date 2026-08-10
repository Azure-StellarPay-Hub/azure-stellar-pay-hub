import { describe, expect, it } from '@jest/globals';
import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  it('has a display name', () => {
    expect(Skeleton.name).toBe('Skeleton');
  });

  it('renders without throwing', () => {
    expect(() => Skeleton({ className: 'h-4 w-4' })).not.toThrow();
  });

  it('accepts custom className', () => {
    expect(() => Skeleton({ className: 'h-10 w-full rounded-xl' })).not.toThrow();
  });
});
