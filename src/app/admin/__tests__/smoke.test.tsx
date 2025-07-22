import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import AdminDashboard from '../overview/page';

test('renders admin dashboard without crashing', () => {
  render(<AdminDashboard />);
  expect(screen.getByText(/Mission Control/i)).toBeInTheDocument();
}); 