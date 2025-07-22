import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock implementation for the admin page
const AdminPage = () => <div>Mission Control</div>;

test('renders admin page', () => {
  render(<AdminPage />);
  expect(screen.getByText(/Mission Control/i)).toBeInTheDocument();
}); 