import { describe, it, expect } from 'vitest';
import { normalizePhoneNumber } from '../../repositories/userRepository';

describe('normalizePhoneNumber', () => {
	describe('US phone numbers', () => {
		it('should normalize 10-digit US number', () => {
			expect(normalizePhoneNumber('5551234567')).toBe('+15551234567');
		});

		it('should normalize 10-digit number with dashes', () => {
			expect(normalizePhoneNumber('555-123-4567')).toBe('+15551234567');
		});

		it('should normalize 10-digit number with parentheses and spaces', () => {
			expect(normalizePhoneNumber('(555) 123-4567')).toBe('+15551234567');
		});

		it('should normalize 11-digit number starting with 1', () => {
			expect(normalizePhoneNumber('15551234567')).toBe('+15551234567');
		});

		it('should normalize 11-digit number with 1 prefix and dashes', () => {
			expect(normalizePhoneNumber('1-555-123-4567')).toBe('+15551234567');
		});

		it('should handle number already with +1 prefix', () => {
			expect(normalizePhoneNumber('+15551234567')).toBe('+15551234567');
		});

		it('should handle number with +1 prefix and formatting', () => {
			expect(normalizePhoneNumber('+1 (555) 123-4567')).toBe('+15551234567');
		});

		it('should handle number with +1 prefix and spaces', () => {
			expect(normalizePhoneNumber('+1 555 123 4567')).toBe('+15551234567');
		});
	});

	describe('International phone numbers', () => {
		it('should preserve international number with + prefix', () => {
			expect(normalizePhoneNumber('+442012345678')).toBe('+442012345678');
		});

		it('should normalize international number with formatting', () => {
			expect(normalizePhoneNumber('+44 20 1234 5678')).toBe('+442012345678');
		});

		it('should handle international number with dashes', () => {
			expect(normalizePhoneNumber('+44-20-1234-5678')).toBe('+442012345678');
		});
	});

	describe('Edge cases', () => {
		it('should trim whitespace', () => {
			expect(normalizePhoneNumber('  555-123-4567  ')).toBe('+15551234567');
		});

		it('should handle dots as separators', () => {
			expect(normalizePhoneNumber('555.123.4567')).toBe('+15551234567');
		});

		it('should handle mixed separators', () => {
			expect(normalizePhoneNumber('555-123.4567')).toBe('+15551234567');
		});

		it('should strip all non-digit characters except leading +', () => {
			expect(normalizePhoneNumber('+1 (555) ABC-1234 ext.567')).toBe('+15551234567');
		});

		it('should handle number with only digits and + in middle (strip the +)', () => {
			expect(normalizePhoneNumber('555+1234567')).toBe('+15551234567');
		});
	});
});
