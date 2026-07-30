export const HOME_LAYOUT_COMPONENT_OPTIONS = [
  { key: 'HeroNew', label: 'Hero (üst vitrin)' },
  { key: 'BannerSlot', label: 'Banner alanı' },
  { key: 'PromisesSection', label: 'Özet / vaatler' },
  { key: 'FeaturesNew', label: 'Özellikler (3 sütun)' },
  { key: 'HomeIntroSection', label: 'Nasıl çalışır (adımlar)' },
  { key: 'WelcomeBannerSection', label: 'Karşılama bandı' },
  { key: 'HomeCTABanner', label: 'CTA bandı' },
] as const;

export const HOME_LAYOUT_COMPONENT_KEYS = HOME_LAYOUT_COMPONENT_OPTIONS.map((o) => o.key);
