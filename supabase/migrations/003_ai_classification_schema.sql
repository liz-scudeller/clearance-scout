alter table public.raw_deal_mentions
  add column if not exists ai_error_message text;

alter table public.deals
  add column if not exists ai_summary text,
  add column if not exists ai_confidence_score integer,
  add column if not exists detection_method text not null default 'automated_ai',
  add column if not exists raw_mention_id uuid references public.raw_deal_mentions(id) on delete set null;

alter table public.deals
  alter column detection_method set default 'automated_ai';

alter table public.deals
  drop constraint if exists deals_source_type_check;

alter table public.deals
  add constraint deals_source_type_check
  check (source_type in (
    'user_report',
    'official_site',
    'flyer',
    'facebook_link',
    'reddit',
    'event',
    'other',
    'automated_scan',
    'search',
    'mall',
    'eventbrite',
    'eventbrite_public_search',
    'public_site',
    'manual_test'
  ));

alter table public.raw_deal_mentions
  drop constraint if exists raw_deal_mentions_classification_status_check;

alter table public.raw_deal_mentions
  add constraint raw_deal_mentions_classification_status_check
  check (classification_status in ('new', 'classified', 'ignored', 'converted', 'ai_error'));

insert into public.raw_deal_mentions (
  title,
  snippet,
  raw_text,
  source_type,
  city,
  province,
  detected_keywords,
  classification_status,
  confidence_score
) values
(
  'Sport Chek at The City of Lougheed closing sale',
  'Store closing sale with discounts up to 70% off. Final weeks at Lougheed location.',
  'Store closing sale with discounts up to 70% off. Final weeks at Lougheed location.',
  'manual_test',
  'Burnaby',
  'BC',
  array['store closing', 'closing sale'],
  'new',
  0
),
(
  'Weekend flyer deals at Canadian Tire',
  'Save on selected tools and outdoor items this weekend.',
  'Save on selected tools and outdoor items this weekend.',
  'manual_test',
  'Burnaby',
  'BC',
  array['sale'],
  'new',
  0
),
(
  'Warehouse sale in Coquitlam',
  'Furniture warehouse sale with floor models up to 50% off.',
  'Furniture warehouse sale with floor models up to 50% off.',
  'eventbrite',
  'Coquitlam',
  'BC',
  array['warehouse sale', 'floor model'],
  'new',
  0
),
(
  'Baby store relocating in Vancouver',
  'Everything must go before we move to our new location.',
  'Everything must go before we move to our new location.',
  'public_site',
  'Vancouver',
  'BC',
  array['everything must go', 'relocation'],
  'new',
  0
);
