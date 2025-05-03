// src/routes/page.svelte.test.js
import { describe, test, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import Page from './(public)/+page.svelte';

// Mock the base path
vi.mock('$app/paths', () => ({
  base: ''
}));

describe('/+page.svelte', () => {
  test('should render h2', () => { // Note: your page has h2, not h1
    render(Page);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });
});