-- =====================================================================
-- PUP ACCESS (Association of Concerned Computer Engineering Students)
-- Finance & Transparency Platform ("ACCESS Vault")
-- Database Migration Script 02: Initial Organizational Seed Data
-- =====================================================================

-- 1. Populate Member Whitelist
INSERT INTO member_whitelist (email, full_name, student_number, is_active)
VALUES
  ('president@pupaccess.org', 'Sophia Lim', '2022-01923-MN-0', true),
  ('treasurer@pupaccess.org', 'Daniel Bithao', '2023-04821-MN-0', true),
  ('projecthead.hardhatting@pupaccess.org', 'Ren Zapanta', '2023-08291-MN-0', true),
  ('student.member@pup.edu.ph', 'Andrei Saldivar', '2024-03912-MN-0', true)
ON CONFLICT (email) DO UPDATE SET is_active = true;

-- 2. Populate Fiscal Year
INSERT INTO fiscal_years (id, label, start_date, end_date, is_active, total_budget_cap)
VALUES
  ('cfbe9e32-7b98-4aab-9cac-664dab582563', 'A.Y. 2025-2026', '2025-08-01', '2026-07-31', true, 253162.16)
ON CONFLICT (id) DO UPDATE SET total_budget_cap = 253162.16;

-- 3. Populate Event Budgets
INSERT INTO event_budgets (id, fiscal_year_id, name, slug, purpose, technique, total_allocated, contingency_buffer, status)
VALUES
  (
    '0f9b31a7-a209-4716-b7e7-aaea09276ce6',
    'cfbe9e32-7b98-4aab-9cac-664dab582563',
    'CpE Fair Financial Summary',
    'cpe-fair-summary-2025',
    'Inter-year sports tournament, esports, and departmental exhibits.',
    'ACTIVITY_BASED',
    48162.16,
    1977.00,
    'COMPLETED'
  ),
  (
    '5409ed86-8685-4bbd-9813-433b96e2dc7b',
    'cfbe9e32-7b98-4aab-9cac-664dab582563',
    'Coded for the Future: Hardhatting Ceremony 2026',
    'hardhatting-ceremony-2026',
    'Official departmental hardhatting ceremony and rites of passage for 2nd year Computer Engineering students at PUP Bulwagang Balagtas.',
    'ACTIVITY_BASED',
    85000.00,
    8500.00,
    'ACTIVE'
  ),
  (
    '43d36748-2549-44cc-a441-7a237b9766b9',
    'cfbe9e32-7b98-4aab-9cac-664dab582563',
    'Computer Engineering Month 2026',
    'ce-month-2026',
    'Inter-batch technical competitions, hackathons, robotics exhibits, and esports tournament for over 1,500 CpE students.',
    'ENVELOPE_70_20_10',
    120000.00,
    12000.00,
    'ACTIVE'
  )
ON CONFLICT (slug) DO UPDATE SET total_allocated = EXCLUDED.total_allocated;

-- 4. Populate Budget Categories
INSERT INTO budget_categories (event_budget_id, name, allocated_amount)
VALUES
  ('0f9b31a7-a209-4716-b7e7-aaea09276ce6', 'Basketball (7 Teams Quota)', 14880.00),
  ('0f9b31a7-a209-4716-b7e7-aaea09276ce6', 'Volleyball (6 Teams Quota)', 14960.00),
  ('0f9b31a7-a209-4716-b7e7-aaea09276ce6', 'Badminton (5 Teams Quota)', 2320.00),
  ('0f9b31a7-a209-4716-b7e7-aaea09276ce6', 'Esports Tournament (25 Teams)', 5244.00),
  ('0f9b31a7-a209-4716-b7e7-aaea09276ce6', 'ACCESS Org Materials & Trophies', 10758.16),
  ('5409ed86-8685-4bbd-9813-433b96e2dc7b', 'Hardhat Gear & Safety Collaterals', 32000.00),
  ('5409ed86-8685-4bbd-9813-433b96e2dc7b', 'Stage, AV & Bulwagang Balagtas Venue', 22000.00),
  ('5409ed86-8685-4bbd-9813-433b96e2dc7b', 'Food & Dignitary Refreshments', 18000.00),
  ('43d36748-2549-44cc-a441-7a237b9766b9', 'Hackathon & Technical Equipment', 45000.00),
  ('43d36748-2549-44cc-a441-7a237b9766b9', 'Robotics Exhibit & Arena Props', 35000.00)
ON CONFLICT DO NOTHING;
