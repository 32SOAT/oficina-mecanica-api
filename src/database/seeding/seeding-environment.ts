export const shouldEnableSeedingModule = (environment?: string): boolean =>
  environment?.toLowerCase() !== 'production';
