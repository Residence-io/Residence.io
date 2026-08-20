import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  generateTemporaryPassword,
  ResidentRegistrationForm,
} from './resident-registration-form';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const properties = [
  {
    id: 'property',
    block: 'A',
    propertyNumber: '12',
    type: 'HOUSE',
    units: [
      {
        id: '14e6b1c0-1b6b-4a46-8808-c675dcf62058',
        unitNumber: '1',
        status: 'AVAILABLE',
      },
    ],
  },
];
const unitLabel = 'A · 12 · 1 (AVAILABLE)';

function renderForm() {
  render(<ResidentRegistrationForm csrfToken="test" properties={properties} />);
}

function completePersonal() {
  fireEvent.change(screen.getByLabelText('Full Name'), {
    target: { value: 'Tenant Resident' },
  });
  fireEvent.change(screen.getByLabelText('Birth day'), {
    target: { value: '01' },
  });
  fireEvent.change(screen.getByLabelText('Birth month'), {
    target: { value: '01' },
  });
  fireEvent.change(screen.getByLabelText('Birth year'), {
    target: { value: '1990' },
  });
  fireEvent.change(screen.getByLabelText(/Gender/i), {
    target: { value: 'MALE' },
  });
  fireEvent.change(screen.getByLabelText('Primary Phone'), {
    target: { value: '+923001234567' },
  });
  fireEvent.change(screen.getByLabelText(/CNIC/i), {
    target: { value: '12345-1234567-1' },
  });
}

function completeDate(label: string, value: string) {
  const [year, month, day] = value.split('-');
  fireEvent.change(screen.getByLabelText(`${label} day`), {
    target: { value: day },
  });
  fireEvent.change(screen.getByLabelText(`${label} month`), {
    target: { value: month },
  });
  fireEvent.change(screen.getByLabelText(`${label} year`), {
    target: { value: year },
  });
}

describe('ResidentRegistrationForm', () => {
  it('shows only the approved personal fields and preserves tenant rules', () => {
    renderForm();
    expect(screen.getByLabelText('Birth year')).toBeInTheDocument();
    completePersonal();
    expect(document.querySelector('input[name="dateOfBirth"]')).toHaveValue(
      '1990-01-01',
    );
    expect(
      screen.queryByLabelText('Father, spouse, or guardian'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('Permanent address'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('Emergency Contact Name'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(/Emergency Contact Phone/i),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.change(screen.getByLabelText('Ownership Status'), {
      target: { value: 'TENANT' },
    });
    expect(
      (screen.getByLabelText('Property Owner Name') as HTMLInputElement)
        .required,
    ).toBe(true);
    expect(screen.queryByLabelText('Security deposit')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect((screen.getByLabelText('Full Name') as HTMLInputElement).value).toBe(
      'Tenant Resident',
    );
  });

  it('uses exactly three steps without member or vehicle registration fields', () => {
    renderForm();
    expect(screen.getByText('1. Personal')).toBeInTheDocument();
    expect(screen.getByText('2. Residence')).toBeInTheDocument();
    expect(screen.getByText('3. Account and Review')).toBeInTheDocument();
    expect(screen.queryByText('Members and Vehicles')).not.toBeInTheDocument();
    completePersonal();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.change(screen.getByLabelText(/Property and Unit/i), {
      target: { value: unitLabel },
    });

    expect(document.querySelector('input[name="unitId"]')).toHaveValue(
      properties[0]!.units[0]!.id,
    );
    completeDate('Move-in Date', '2026-07-28');
    expect(document.querySelector('input[name="moveInDate"]')).toHaveValue(
      '2026-07-28',
    );
    fireEvent.change(screen.getByLabelText('Initial Monthly Fee'), {
      target: { value: '5000' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      screen.getByRole('button', { name: 'Register Resident' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add Members' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add Vehicles' })).toBeNull();
  });

  it('generates password-policy compliant cryptographic temporary passwords', () => {
    const first = generateTemporaryPassword();
    const second = generateTemporaryPassword();
    expect(first).toHaveLength(20);
    expect(first).toMatch(/[A-Z]/);
    expect(first).toMatch(/[a-z]/);
    expect(first).toMatch(/[0-9]/);
    expect(first).not.toBe(second);
  });

  it('shows Generate Password and keeps account creation blocked without one', () => {
    renderForm();
    completePersonal();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.change(screen.getByLabelText(/Property and Unit/i), {
      target: { value: unitLabel },
    });
    completeDate('Move-in Date', '2026-07-28');
    fireEvent.change(screen.getByLabelText('Initial Monthly Fee'), {
      target: { value: '5000' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByLabelText('Create Account'));
    expect(
      screen.getByRole('button', { name: 'Generate Password' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Temporary Password')).toBeRequired();
    fireEvent.click(screen.getByRole('button', { name: 'Generate Password' }));
    expect(
      (screen.getByLabelText('Temporary Password') as HTMLInputElement).value,
    ).toHaveLength(20);
  });
});
