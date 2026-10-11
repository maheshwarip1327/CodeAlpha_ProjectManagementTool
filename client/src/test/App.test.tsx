import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import { EmptyState } from '../components/common/EmptyState';
import { getInitials, getPriorityColor, getStatusBadge, formatDate } from '../lib/utils';
import { FolderKanban } from 'lucide-react';

describe('Frontend Logic & Utilities', () => {
  it('generates correct initials from user full names', () => {
    expect(getInitials('Alex Morgan')).toBe('AM');
    expect(getInitials('Sarah')).toBe('S');
    expect(getInitials('John Doe Smith')).toBe('JD');
    expect(getInitials('')).toBe('U');
  });

  it('computes correct priority styling classes', () => {
    const urgent = getPriorityColor('urgent');
    expect(urgent.bg).toContain('bg-red-50');
    expect(urgent.border).toContain('border-red-200');

    const high = getPriorityColor('high');
    expect(high.bg).toContain('bg-amber-50');

    const medium = getPriorityColor('medium');
    expect(medium.bg).toContain('bg-blue-50');
  });

  it('maps status enums to friendly badge labels and colors', () => {
    expect(getStatusBadge('in_progress').label).toBe('In Progress');
    expect(getStatusBadge('completed').label).toBe('Completed');
    expect(getStatusBadge('todo').label).toBe('To Do');
  });

  it('formats dates consistently', () => {
    expect(formatDate(null)).toBe('No date');
    expect(formatDate(undefined)).toBe('No date');
    const valid = formatDate('2026-10-15T12:00:00.000Z');
    expect(valid).toContain('2026');
  });

  it('renders EmptyState with custom title and action button', () => {
    let clicked = false;
    render(
      <EmptyState
        icon={FolderKanban}
        title="Zero Projects"
        description="Get started with your first project"
        actionLabel="Create Now"
        onAction={() => {
          clicked = true;
        }}
      />
    );

    expect(screen.getByText('Zero Projects')).toBeInTheDocument();
    expect(screen.getByText('Get started with your first project')).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /create now/i });
    btn.click();
    expect(clicked).toBe(true);
  });

  it('renders Landing Page hero headline and CTAs', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Turn Teamwork/i)).toBeInTheDocument();
    expect(screen.getByText(/Results/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Get Started Free/i }).length).toBeGreaterThan(0);
  });
});
