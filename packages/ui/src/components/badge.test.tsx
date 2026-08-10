import { describe, expect, it } from '@jest/globals';
import { Badge } from './badge';

describe('Badge', () => {
  it('has a display name', () => {
    expect(Badge.name).toBe('Badge');
  });

  it('accepts variant and children props', () => {
    // Badge is a simple div wrapper — test that it doesn't throw on render
    expect(() => Badge({ variant: 'default', children: 'Label' })).not.toThrow();
  });

  it('accepts success variant', () => {
    expect(() => Badge({ variant: 'success', children: 'OK' })).not.toThrow();
  });

  it('accepts destructive variant', () => {
    expect(() => Badge({ variant: 'destructive', children: 'Error' })).not.toThrow();
  });

  it('accepts warning variant', () => {
    expect(() => Badge({ variant: 'warning', children: 'Warn' })).not.toThrow();
  });

  it('accepts info variant', () => {
    expect(() => Badge({ variant: 'info', children: 'Info' })).not.toThrow();
  });

  it('accepts outline variant', () => {
    expect(() => Badge({ variant: 'outline', children: 'Outline' })).not.toThrow();
  });

  it('accepts secondary variant', () => {
    expect(() => Badge({ variant: 'secondary', children: 'Secondary' })).not.toThrow();
  });

  it('renders without variant (falls back to default)', () => {
    expect(() => Badge({ children: 'Default' })).not.toThrow();
  });
});
