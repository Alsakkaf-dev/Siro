import { describe, expect, it } from 'vitest';
import { bareLibId, libRefOf, libraryItemPath } from '../shared/library.js';

describe('library item paths', () => {
  it('strips accidental f:/y: prefixes', () => {
    expect(bareLibId('64b01b7bf0713ca9')).toBe('64b01b7bf0713ca9');
    expect(bareLibId('f:64b01b7bf0713ca9')).toBe('64b01b7bf0713ca9');
    expect(bareLibId('y:abc')).toBe('abc');
  });

  it('builds UI paths without double prefix', () => {
    expect(libraryItemPath('file', '64b01b7bf0713ca9')).toBe('/library/f/64b01b7bf0713ca9');
    expect(libraryItemPath('file', 'f:64b01b7bf0713ca9')).toBe('/library/f/64b01b7bf0713ca9');
    expect(libraryItemPath('youtube', 'y:abc')).toBe('/library/y/abc');
  });

  it('builds API refs from bare or prefixed ids', () => {
    expect(libRefOf('file', 'f:64b01b7bf0713ca9')).toBe('f:64b01b7bf0713ca9');
    expect(libRefOf('file', '64b01b7bf0713ca9')).toBe('f:64b01b7bf0713ca9');
    expect(libRefOf('youtube', 'y:abc')).toBe('y:abc');
  });
});
