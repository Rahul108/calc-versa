import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './app';
import { jsonResponse, mockFetch } from './test-utils';

describe('App routing', () => {
  beforeEach(() => localStorage.clear());

  it('sends signed-out users to the login page', async () => {
    const fetchMock = mockFetch(() => jsonResponse(200, {}));
    render(
      <MemoryRouter initialEntries={['/product?id=abc']}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeTruthy();
    expect(screen.queryByLabelText(/password/i)).toBeTruthy();
    // No credentials are pre-filled.
    expect((screen.getByLabelText(/username or email/i) as HTMLInputElement).value).toBe('');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('validates a stored token before showing protected pages', async () => {
    localStorage.setItem('calcversa_jwt_token', 'h.eyJleHAiOjk5OTk5OTk5OTl9.s');
    mockFetch((url) =>
      jsonResponse(200, String(url).endsWith('/auth/me') ? { id: 'u1', username: 'jane', email: 'j@x', is_admin: false } : []),
    );

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByText(/you don't have any tools yet/i)).toBeTruthy();
    await waitFor(() => expect(screen.getByText('jane')).toBeTruthy());
    // Non-admins don't see creator navigation.
    expect(screen.queryByRole('link', { name: /create tool/i })).toBeNull();
  });
});
