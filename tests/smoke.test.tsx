import { render, screen } from '@testing-library/react';
import App from '../src/App';

it('shows the game title and new chronicle action', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: 'MORROWMERE' })).toBeVisible();
  expect(screen.getByText('Chronicle I — The Black Banner')).toBeVisible();
  expect(screen.getAllByRole('article', { name: /Save slot/i })).toHaveLength(3);
  expect(screen.getByRole('button', { name: 'Begin slot 1' })).toBeEnabled();
});
