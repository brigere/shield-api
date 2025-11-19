import { describe, it, expect, beforeEach } from 'vitest';
import Container from 'typedi';
import { PasswordService } from '../../../src/libs/services/password.service';

describe('PasswordService', () => {
  let passwordService: PasswordService;

  beforeEach(() => {
    Container.reset();
    passwordService = Container.get(PasswordService);
  });

  describe('hash', () => {
    it('should hash a password', async () => {
      const password = 'Password123!';
      const hashed = await passwordService.hash(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt format
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'Password123!';
      const hash1 = await passwordService.hash(password);
      const hash2 = await passwordService.hash(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('compare', () => {
    it('should return true for matching password', async () => {
      const password = 'Password123!';
      const hashed = await passwordService.hash(password);
      const result = await passwordService.compare(password, hashed);

      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'Password123!';
      const wrongPassword = 'WrongPassword123!';
      const hashed = await passwordService.hash(password);
      const result = await passwordService.compare(wrongPassword, hashed);

      expect(result).toBe(false);
    });
  });

  describe('validateStrength', () => {
    it('should validate a strong password', () => {
      const result = passwordService.validateStrength('Password123!');
      expect(result.valid).toBe(true);
    });

    it('should reject password without uppercase', () => {
      const result = passwordService.validateStrength('password123!');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('uppercase');
    });

    it('should reject password without lowercase', () => {
      const result = passwordService.validateStrength('PASSWORD123!');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('lowercase');
    });

    it('should reject password without number', () => {
      const result = passwordService.validateStrength('Password!');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('number');
    });

    it('should reject password without special character', () => {
      const result = passwordService.validateStrength('Password123');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('special');
    });

    it('should reject short password', () => {
      const result = passwordService.validateStrength('P!');
      expect(result.valid).toBe(false);
    });
  });
});
