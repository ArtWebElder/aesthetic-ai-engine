import { Generation, CreditBalance, Template } from '@/types';

export const mockCredits: CreditBalance = { current: 247 };

export const mockProjects: { id: string; name: string; type: string; format: string; stylePreset: string; createdAt: string; updatedAt: string }[] = [
  { id: '1', name: 'Summer Campaign Hero', type: 'social_post', format: 'feed_1080x1350', stylePreset: 'bold_ads', createdAt: '2026-02-10T10:00:00Z', updatedAt: '2026-02-14T14:30:00Z' },
  { id: '2', name: 'Product Launch Banner', type: 'ecom_banner', format: 'ecom_desktop_1920x800', stylePreset: 'glass', createdAt: '2026-02-08T09:00:00Z', updatedAt: '2026-02-13T11:00:00Z' },
  { id: '3', name: 'Skincare Photoshoot', type: 'photoshoot', format: 'square_1024', stylePreset: 'editorial', createdAt: '2026-02-05T15:00:00Z', updatedAt: '2026-02-12T09:45:00Z' },
  { id: '4', name: 'Black Friday Story', type: 'social_post', format: 'story_1080x1920', stylePreset: 'bold_ads', createdAt: '2026-02-01T08:00:00Z', updatedAt: '2026-02-10T16:00:00Z' },
  { id: '5', name: 'New Arrivals Feed', type: 'social_post', format: 'feed_1080', stylePreset: 'minimal_clean', createdAt: '2026-01-28T12:00:00Z', updatedAt: '2026-02-09T10:00:00Z' },
];

export const mockGenerations: Generation[] = [
  { id: 'g1', projectId: '1', status: 'completed', createdAt: '2026-02-14T14:30:00Z' },
  { id: 'g2', projectId: '1', status: 'completed', createdAt: '2026-02-14T14:00:00Z' },
  { id: 'g3', projectId: '2', status: 'processing', createdAt: '2026-02-13T11:00:00Z' },
  { id: 'g4', projectId: '3', status: 'completed', createdAt: '2026-02-12T09:45:00Z' },
  { id: 'g5', projectId: '4', status: 'failed', createdAt: '2026-02-10T16:00:00Z' },
];

export const mockTemplates: Template[] = [
  { id: 't1', name: 'Bold Typography', category: 'social' },
  { id: 't2', name: 'Product Spotlight', category: 'social' },
  { id: 't3', name: 'Gradient Overlay', category: 'social' },
  { id: 't4', name: 'Minimal Card', category: 'social' },
  { id: 't5', name: 'Story Impact', category: 'social' },
  { id: 't6', name: 'Carousel Slide', category: 'social' },
  { id: 't7', name: 'Hero Banner', category: 'ecom' },
  { id: 't8', name: 'Sale Strip', category: 'ecom' },
  { id: 't9', name: 'Product Grid', category: 'ecom' },
  { id: 't10', name: 'Lifestyle Banner', category: 'ecom' },
  { id: 't11', name: 'Studio White', category: 'photoshoot' },
  { id: 't12', name: 'Natural Light', category: 'photoshoot' },
];
