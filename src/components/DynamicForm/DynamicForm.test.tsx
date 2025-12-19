import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { DynamicForm } from './DynamicForm';
import { FormConfig } from '../../types/FormConfig';

// Single-page config (backwards compatibility)
const mockConfig: FormConfig = {
  title: 'Event Registration',
  description: 'Please fill out the form below.\n\n**All fields are required**.',
  fields: [
    {
      id: 'eventName',
      type: 'text',
      label: 'Event Name',
      placeholder: 'Enter your event name',
      required: true,
    },
    {
      id: 'hostName',
      type: 'text',
      label: 'Host Name',
      placeholder: 'Enter the host name',
      required: true,
    },
    {
      id: 'partySize',
      type: 'select',
      label: 'Party Size',
      required: true,
      options: [
        { value: '1-10', label: '1-10 guests' },
        { value: '11-20', label: '11-20 guests' },
        { value: '21-50', label: '21-50 guests' },
      ],
    },
    {
      id: 'largePartyAgreement',
      type: 'checkbox',
      label: 'Large Party Agreement',
      description: 'By checking this box, I agree to the **terms**.',
      checkboxLabel: 'I Agree',
      required: true,
      condition: {
        field: 'partySize',
        operator: 'in',
        values: ['21-50'],
      },
    },
  ],
};

// Multi-page config
const mockMultiPageConfig: FormConfig = {
  title: 'Event Registration',
  description: 'Please complete all pages.',
  pages: [
    {
      title: 'Basic Information',
      description: 'Tell us about your event.',
      fields: [
        {
          id: 'eventName',
          type: 'text',
          label: 'Event Name',
          required: true,
        },
        {
          id: 'hostName',
          type: 'text',
          label: 'Host Name',
          required: true,
        },
      ],
    },
    {
      title: 'Event Details',
      description: 'Provide event details.',
      fields: [
        {
          id: 'eventDate',
          type: 'text',
          label: 'Event Date',
          required: true,
        },
        {
          id: 'partySize',
          type: 'select',
          label: 'Party Size',
          required: true,
          options: [
            { value: '1-10', label: '1-10 guests' },
            { value: '21-50', label: '21-50 guests' },
          ],
        },
      ],
    },
  ],
};

describe('DynamicForm', () => {
  describe('Single-page form (backwards compatibility)', () => {
    it('renders the form title', () => {
      render(<DynamicForm config={mockConfig} />);
      expect(screen.getByText('Event Registration')).toBeInTheDocument();
    });

    it('renders the form description with markdown', () => {
      render(<DynamicForm config={mockConfig} />);
      expect(screen.getByText('Please fill out the form below.')).toBeInTheDocument();
      expect(screen.getByText('All fields are required')).toBeInTheDocument();
    });

    it('renders text fields with labels', () => {
      render(<DynamicForm config={mockConfig} />);
      expect(screen.getByLabelText(/Event Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Host Name/i)).toBeInTheDocument();
    });

    it('renders select field with label', () => {
      render(<DynamicForm config={mockConfig} />);
      expect(screen.getByLabelText(/Party Size/i)).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<DynamicForm config={mockConfig} />);
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    it('does not render conditional checkbox when condition is not met', () => {
      render(<DynamicForm config={mockConfig} />);
      expect(screen.queryByLabelText(/I Agree/i)).not.toBeInTheDocument();
    });

    it('renders conditional checkbox when condition is met', async () => {
      const user = userEvent.setup();
      render(<DynamicForm config={mockConfig} />);

      // Open the select dropdown and choose '21-50'
      const select = screen.getByLabelText(/Party Size/i);
      await user.click(select);

      const option = await screen.findByRole('option', { name: '21-50 guests' });
      await user.click(option);

      // Now the checkbox should be visible
      expect(screen.getByLabelText(/I Agree/i)).toBeInTheDocument();
    });

    it('calls onSubmit with form values when submitted', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();
      render(<DynamicForm config={mockConfig} onSubmit={handleSubmit} />);

      // Fill in text fields
      await user.type(screen.getByLabelText(/Event Name/i), 'Birthday Party');
      await user.type(screen.getByLabelText(/Host Name/i), 'John Doe');

      // Fill in required select field
      const select = screen.getByLabelText(/Party Size/i);
      await user.click(select);
      const option = await screen.findByRole('option', { name: '1-10 guests' });
      await user.click(option);

      // Submit the form
      await user.click(screen.getByRole('button', { name: /submit/i }));

      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: 'Birthday Party',
          hostName: 'John Doe',
          partySize: '1-10',
        })
      );
    });

    it('does not show stepper for single-page form', () => {
      render(<DynamicForm config={mockConfig} />);
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });
  });

  describe('Multi-page form', () => {
    it('renders the form title', () => {
      render(<DynamicForm config={mockMultiPageConfig} />);
      expect(screen.getByText('Event Registration')).toBeInTheDocument();
    });

    it('renders stepper with page titles', () => {
      render(<DynamicForm config={mockMultiPageConfig} />);
      // Page titles appear in both stepper and as heading, so use getAllByText
      expect(screen.getAllByText('Basic Information').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Event Details').length).toBeGreaterThanOrEqual(1);
    });

    it('renders only first page fields initially', () => {
      render(<DynamicForm config={mockMultiPageConfig} />);
      expect(screen.getByLabelText(/Event Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Host Name/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/Event Date/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Party Size/i)).not.toBeInTheDocument();
    });

    it('shows Next button on first page', () => {
      render(<DynamicForm config={mockMultiPageConfig} />);
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /submit/i })).not.toBeInTheDocument();
    });

    it('navigates to second page when Next is clicked', async () => {
      const user = userEvent.setup();
      render(<DynamicForm config={mockMultiPageConfig} />);

      // Fill in required fields on first page
      await user.type(screen.getByLabelText(/Event Name/i), 'Test Event');
      await user.type(screen.getByLabelText(/Host Name/i), 'Test Host');

      await user.click(screen.getByRole('button', { name: /next/i }));

      // Second page fields should now be visible
      expect(screen.getByLabelText(/Event Date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Party Size/i)).toBeInTheDocument();
      // First page fields should be hidden
      expect(screen.queryByLabelText(/Event Name/i)).not.toBeInTheDocument();
    });

    it('shows Back and Submit buttons on last page', async () => {
      const user = userEvent.setup();
      render(<DynamicForm config={mockMultiPageConfig} />);

      // Fill in required fields on first page
      await user.type(screen.getByLabelText(/Event Name/i), 'Test Event');
      await user.type(screen.getByLabelText(/Host Name/i), 'Test Host');

      await user.click(screen.getByRole('button', { name: /next/i }));

      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
    });

    it('navigates back to first page when Back is clicked', async () => {
      const user = userEvent.setup();
      render(<DynamicForm config={mockMultiPageConfig} />);

      // Fill in required fields on first page
      await user.type(screen.getByLabelText(/Event Name/i), 'Test Event');
      await user.type(screen.getByLabelText(/Host Name/i), 'Test Host');

      // Go to second page
      await user.click(screen.getByRole('button', { name: /next/i }));
      expect(screen.getByLabelText(/Event Date/i)).toBeInTheDocument();

      // Go back to first page
      await user.click(screen.getByRole('button', { name: /back/i }));
      expect(screen.getByLabelText(/Event Name/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/Event Date/i)).not.toBeInTheDocument();
    });

    it('preserves form values when navigating between pages', async () => {
      const user = userEvent.setup();
      render(<DynamicForm config={mockMultiPageConfig} />);

      // Fill in first page (both required fields)
      await user.type(screen.getByLabelText(/Event Name/i), 'Birthday Party');
      await user.type(screen.getByLabelText(/Host Name/i), 'Test Host');

      // Go to second page
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Go back to first page
      await user.click(screen.getByRole('button', { name: /back/i }));

      // Values should be preserved
      expect(screen.getByLabelText(/Event Name/i)).toHaveValue('Birthday Party');
      expect(screen.getByLabelText(/Host Name/i)).toHaveValue('Test Host');
    });

    it('calls onSubmit with all form values when submitted on last page', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();
      render(<DynamicForm config={mockMultiPageConfig} onSubmit={handleSubmit} />);

      // Fill in first page
      await user.type(screen.getByLabelText(/Event Name/i), 'Birthday Party');
      await user.type(screen.getByLabelText(/Host Name/i), 'John Doe');

      // Go to second page
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Fill in second page
      await user.type(screen.getByLabelText(/Event Date/i), '12/25/2024');

      // Fill in required select field
      const select = screen.getByLabelText(/Party Size/i);
      await user.click(select);
      const option = await screen.findByRole('option', { name: '1-10 guests' });
      await user.click(option);

      // Submit
      await user.click(screen.getByRole('button', { name: /submit/i }));

      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: 'Birthday Party',
          hostName: 'John Doe',
          eventDate: '12/25/2024',
          partySize: '1-10',
        })
      );
    });

    it('renders page description', async () => {
      const user = userEvent.setup();
      render(<DynamicForm config={mockMultiPageConfig} />);
      expect(screen.getByText('Tell us about your event.')).toBeInTheDocument();

      // Fill in required fields on first page
      await user.type(screen.getByLabelText(/Event Name/i), 'Test Event');
      await user.type(screen.getByLabelText(/Host Name/i), 'Test Host');

      await user.click(screen.getByRole('button', { name: /next/i }));
      expect(screen.getByText('Provide event details.')).toBeInTheDocument();
    });
  });
});
