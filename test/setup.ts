import 'reflect-metadata';
import { beforeAll, afterAll, afterEach } from 'vitest';
import Container from 'typedi';

beforeAll(async () => {
  // Setup code that runs once before all tests
  console.log('🧪 Setting up test environment...');
});

afterAll(async () => {
  // Cleanup code that runs once after all tests
  console.log('🧹 Cleaning up test environment...');
  Container.reset();
});

afterEach(() => {
  // Reset container after each test to ensure isolation
  Container.reset();
});
