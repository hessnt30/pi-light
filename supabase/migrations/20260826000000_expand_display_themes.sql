-- Allow pastel and holiday display themes

alter table public.display_settings
  drop constraint if exists display_settings_theme_check;

alter table public.display_settings
  add constraint display_settings_theme_check
  check (theme in (
    'light',
    'dark',
    'system',
    'pastel-blush',
    'pastel-mint',
    'pastel-lavender',
    'pastel-peach',
    'pastel-sky',
    'halloween',
    'thanksgiving',
    'christmas',
    'new-year',
    'valentines',
    'easter'
  ));
