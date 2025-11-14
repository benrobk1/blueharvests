/**
 * Shared Playwright test helpers that gracefully skip in environments
 * where the Playwright dependency is unavailable (such as offline CI).
 */
import type { TestType, Expect } from '@playwright/test';

// Define types for Playwright's test and expect
type PlaywrightTest = typeof import('@playwright/test').test;
type PlaywrightExpect = typeof import('@playwright/test').expect;

// Conditional types: use real Playwright types when available, fallback otherwise
let test: PlaywrightTest;
let expect: PlaywrightExpect;
let hasPlaywright = true;

try {
  const playwright = await import('@playwright/test');
  test = playwright.test;
  expect = playwright.expect;
} catch (error) {
  hasPlaywright = false;
  const bun = await import('bun:test');
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const skipTest = (title: string, fn?: (...args: unknown[]) => unknown) => bun.test.skip(title, fn as any);

  // Type the stub to match Playwright's test interface as closely as possible
  const stubTest = ((title: string, fn?: (...args: unknown[]) => unknown) => skipTest(title, fn)) as PlaywrightTest;
  
  // Assign properties to match Playwright test API
  // Using 'as any' is necessary here to dynamically add properties to the function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const testStub = stubTest as any;
  testStub.skip = skipTest;
  testStub.only = skipTest;
  testStub.fixme = skipTest;
  
  const noop = () => {};
  testStub.describe = Object.assign(noop, {
    skip: noop,
    only: noop,
    parallel: noop
  });
  
  testStub.step = async <T>(_: string, body: () => Promise<T> | T) => body();
  testStub.use = () => {};
  testStub.beforeAll = (...args: Parameters<typeof bun.beforeAll>) => bun.beforeAll?.(...args);
  testStub.afterAll = (...args: Parameters<typeof bun.afterAll>) => bun.afterAll?.(...args);
  testStub.beforeEach = (...args: Parameters<typeof bun.beforeEach>) => bun.beforeEach?.(...args);
  testStub.afterEach = (...args: Parameters<typeof bun.afterEach>) => bun.afterEach?.(...args);

  test = stubTest;
  
  // Type the expect stub to match Playwright's expect interface
  expect = (() => {
    throw new Error('Playwright expect is unavailable in this environment.');
  }) as PlaywrightExpect;
}

export { test, expect, hasPlaywright };
