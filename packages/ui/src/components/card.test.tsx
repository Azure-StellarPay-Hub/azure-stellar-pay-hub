import { describe, expect, it } from '@jest/globals';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';

describe('Card', () => {
  it('has a display name', () => {
    expect(Card.displayName).toBe('Card');
  });
});

describe('CardHeader', () => {
  it('has a display name', () => {
    expect(CardHeader.displayName).toBe('CardHeader');
  });
});

describe('CardTitle', () => {
  it('has a display name', () => {
    expect(CardTitle.displayName).toBe('CardTitle');
  });
});

describe('CardDescription', () => {
  it('has a display name', () => {
    expect(CardDescription.displayName).toBe('CardDescription');
  });
});

describe('CardContent', () => {
  it('has a display name', () => {
    expect(CardContent.displayName).toBe('CardContent');
  });
});

describe('CardFooter', () => {
  it('has a display name', () => {
    expect(CardFooter.displayName).toBe('CardFooter');
  });
});
