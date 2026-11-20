import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProductToolPage from './ProductToolPage';

import { jsonResponse as json, mockFetch } from '../../test-utils';

const TOOL = {
  id: 'app-1',
  name: 'Mortgage',
  description: 'Loan tool',
  status: true,
  inputsConfig: { sections: [{ title: 'Loan', fields: [{ id: 'principal', label: 'Principal', type: 'number', defaultValue: 1000 }] }] },
  formulaConfig: { rules: [{ targetOutputId: 'monthly', expression: 'principal / 12' }], outputs: [{ id: 'monthly', label: 'Monthly payment' }] },
  uiConfig: { currency: '$' },
};

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/product" element={<ProductToolPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProductToolPage', () => {
  it('shows a real access error instead of placeholder data when the tool is forbidden', async () => {
    mockFetch(() => json(403, { message: "Access denied: Account is not authorized to access App ID 'app-1'" }));
    renderAt('/product?id=app-1');
    expect(await screen.findByText('No access to this tool')).toBeTruthy();
    expect(screen.queryByText(/Expense Tracker/i)).toBeNull();
  });

  it('lets read-only users calculate but not save', async () => {
    mockFetch((url, init) => {
      if (String(url).endsWith('/calculate')) {
        const body = JSON.parse(String(init?.body));
        expect(body.saveRecord).toBe(false);
        expect(body.payload).toEqual({ principal: 1200 });
        return json(200, { results: { monthly: 100 }, execution_time_ms: 0.2 });
      }
      return json(200, { ...TOOL, access: { read: true, write: false, owner: false } });
    });

    renderAt('/product?id=app-1');
    expect(await screen.findByText('Read only')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /save/i })).toBeNull();

    fireEvent.change(screen.getByLabelText(/principal/i), { target: { value: '1200' } });
    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));
    await waitFor(() => expect(screen.getByText('Monthly payment')).toBeTruthy());
    expect(screen.getByText('100')).toBeTruthy();
  });

  it('shows validation errors instead of calling the API with empty numbers', async () => {
    const fetchMock = mockFetch(() => json(200, { ...TOOL, access: { read: true, write: true, owner: true } }));
    renderAt('/product?id=app-1');
    fireEvent.change(await screen.findByLabelText(/principal/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));
    expect(await screen.findByText('Principal is required')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1); // only the initial GET
  });
});
