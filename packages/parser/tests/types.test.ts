/**
 * Types and Utilities Tests
 * @fileoverview Tests for parser types and utility functions
 */

import { 
  parseLevelSpec, 
  formatLevelSpec, 
  levelMatchesSpec,
  extractAnchorName,
  isAnchorReference,
  isAnchorDefinition,
  isValidAnchorName
} from '../src/types';

describe('Parser Types and Utilities', () => {
  describe('Level Specification Utils', () => {
    test('parseLevelSpec should parse exact levels', () => {
      const result = parseLevelSpec('@1');
      expect(result).toEqual({ base: 1, type: 'exact' });
    });

    test('parseLevelSpec should parse plus levels', () => {
      const result = parseLevelSpec('@2+');
      expect(result).toEqual({ base: 2, type: 'plus' });
    });

    test('parseLevelSpec should parse range levels', () => {
      const result = parseLevelSpec('@1-3');
      expect(result).toEqual({ base: 1, type: 'range', end: 3 });
    });

    test('parseLevelSpec should return null for invalid spec', () => {
      const result = parseLevelSpec('@invalid');
      expect(result).toBeNull();
    });

    test('formatLevelSpec should format exact levels', () => {
      const result = formatLevelSpec({ base: 1, type: 'exact' });
      expect(result).toBe('@1');
    });

    test('formatLevelSpec should format plus levels', () => {
      const result = formatLevelSpec({ base: 2, type: 'plus' });
      expect(result).toBe('@2+');
    });

    test('formatLevelSpec should format range levels', () => {
      const result = formatLevelSpec({ base: 1, type: 'range', end: 3 });
      expect(result).toBe('@1-3');
    });

    test('levelMatchesSpec should match exact levels', () => {
      expect(levelMatchesSpec(1, '@1')).toBe(true);
      expect(levelMatchesSpec(2, '@1')).toBe(false);
    });

    test('levelMatchesSpec should match plus levels', () => {
      expect(levelMatchesSpec(2, '@2+')).toBe(true);
      expect(levelMatchesSpec(3, '@2+')).toBe(true);
      expect(levelMatchesSpec(1, '@2+')).toBe(false);
    });

    test('levelMatchesSpec should match range levels', () => {
      expect(levelMatchesSpec(1, '@1-3')).toBe(true);
      expect(levelMatchesSpec(2, '@1-3')).toBe(true);
      expect(levelMatchesSpec(3, '@1-3')).toBe(true);
      expect(levelMatchesSpec(4, '@1-3')).toBe(false);
    });
  });

  describe('Anchor Utils', () => {
    test('extractAnchorName should extract from definition', () => {
      expect(extractAnchorName('&user')).toBe('user');
      expect(extractAnchorName('*user')).toBe('user');
    });

    test('isAnchorReference should identify references', () => {
      expect(isAnchorReference('*user')).toBe(true);
      expect(isAnchorReference('&user')).toBe(false);
      expect(isAnchorReference('user')).toBe(false);
    });

    test('isAnchorDefinition should identify definitions', () => {
      expect(isAnchorDefinition('&user')).toBe(true);
      expect(isAnchorDefinition('*user')).toBe(false);
      expect(isAnchorDefinition('user')).toBe(false);
    });

    test('isValidAnchorName should validate names', () => {
      expect(isValidAnchorName('user')).toBe(true);
      expect(isValidAnchorName('user_service')).toBe(true);
      expect(isValidAnchorName('user123')).toBe(true);
      expect(isValidAnchorName('123user')).toBe(false);
      expect(isValidAnchorName('user-service')).toBe(false);
    });
  });
}); 