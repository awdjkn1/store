/* CONVERTED inline px→rem by scripts/convert-inline-px-to-rem.js on 2025-11-11T19:57:07.802Z */
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
