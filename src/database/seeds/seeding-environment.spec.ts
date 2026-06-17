import { shouldEnableSeedingModule } from './seeding-environment';

describe('shouldEnableSeedingModule', () => {
  it('disables seeding in production', () => {
    expect(shouldEnableSeedingModule('production')).toBe(false);
    expect(shouldEnableSeedingModule('Production')).toBe(false);
  });

  it('enables seeding outside production', () => {
    expect(shouldEnableSeedingModule('development')).toBe(true);
    expect(shouldEnableSeedingModule('test')).toBe(true);
    expect(shouldEnableSeedingModule()).toBe(true);
  });
});
