import { describe, expect, it } from '@jest/globals';
import { cn } from './utils';

describe('cn', () => {
  it('merges simple class names', () => {
    expect(cn('text-sm', 'font-bold')).toBe('text-sm font-bold');
  });

  it('filters out falsy values', () => {
    expect(cn('text-sm', false && 'hidden', undefined, null, '', 0, 'block')).toBe('text-sm block');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    expect(cn('text-sm', isActive && 'text-primary', 'px-4')).toBe('text-sm text-primary px-4');
  });

  it('resolves tailwind conflicts via twMerge', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    expect(cn('bg-red-500 bg-blue-500', 'bg-green-500')).toBe('bg-green-500');
  });

  it('handles a single class', () => {
    expect(cn('block')).toBe('block');
  });

  it('returns empty string for no arguments', () => {
    expect(cn()).toBe('');
  });

  it('handles object syntax', () => {
    expect(cn({ 'text-sm': true, hidden: false, block: true })).toBe('text-sm block');
  });

  it('handles array syntax', () => {
    expect(cn(['text-sm', 'font-bold'])).toBe('text-sm font-bold');
  });

  it('handles mixed syntax', () => {
    expect(cn('text-sm', ['font-bold', { hidden: false }], { block: true })).toBe(
      'text-sm font-bold block',
    );
  });
});
