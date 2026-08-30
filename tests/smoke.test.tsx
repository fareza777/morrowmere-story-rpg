import { render, screen } from '@testing-library/react';
import App from '../src/App';

it('shows the game title and new chronicle action', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: 'MORROWMERE' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'New Chronicle' })).toBeEnabled();
});
