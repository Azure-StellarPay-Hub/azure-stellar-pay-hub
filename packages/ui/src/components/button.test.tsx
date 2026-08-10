import { describe, expect, it } from '@jest/globals';
import { Button, buttonVariants } from './button';

describe('buttonVariants', () => {
  it('returns default variant classes', () => {
    const result = buttonVariants();
    expect(result).toContain('bg-primary');
    expect(result).toContain('h-10');
  });

  it('returns secondary variant classes', () => {
    const result = buttonVariants({ variant: 'secondary' });
    expect(result).toContain('bg-secondary');
  });

  it('returns outline variant classes', () => {
    const result = buttonVariants({ variant: 'outline' });
    expect(result).toContain('border');
    expect(result).toContain('bg-transparent');
  });

  it('returns ghost variant classes', () => {
    const result = buttonVariants({ variant: 'ghost' });
    expect(result).toContain('hover:bg-accent');
  });

  it('returns destructive variant classes', () => {
    const result = buttonVariants({ variant: 'destructive' });
    expect(result).toContain('bg-destructive');
  });

  it('returns link variant classes', () => {
    const result = buttonVariants({ variant: 'link' });
    expect(result).toContain('underline-offset-4');
  });

  it('returns gradient variant classes', () => {
    const result = buttonVariants({ variant: 'gradient' });
    expect(result).toContain('bg-gradient-to-r');
    expect(result).toContain('from-indigo-500');
  });

  it('returns sm size classes', () => {
    const result = buttonVariants({ size: 'sm' });
    expect(result).toContain('h-8');
    expect(result).toContain('text-xs');
  });

  it('returns lg size classes', () => {
    const result = buttonVariants({ size: 'lg' });
    expect(result).toContain('h-12');
    expect(result).toContain('text-base');
  });

  it('returns icon size classes', () => {
    const result = buttonVariants({ size: 'icon' });
    expect(result).toContain('h-10');
    expect(result).toContain('w-10');
  });

  it('merges className with variant output', () => {
    const result = buttonVariants({ variant: 'default', size: 'default', className: 'my-custom' });
    expect(result).toContain('my-custom');
    expect(result).toContain('bg-primary');
  });
});

describe('Button', () => {
  it('has a display name', () => {
    expect(Button.displayName).toBe('Button');
  });
});
