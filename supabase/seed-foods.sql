-- Seed food_library with Indian food database
-- Run in Supabase SQL editor after creating tables

INSERT INTO food_library (id, name, aliases, category, is_vegetarian, serving_size, serving_grams, calories, protein_g, carbs_g, fat_g, fiber_g, source) VALUES
-- Dal / Lentils
('toor-dal', 'Toor Dal', ARRAY['arhar dal', 'pigeon pea dal'], 'dal', true, '1 bowl (200ml)', 200, 150, 10, 24, 1, 5, 'ifct'),
('moong-dal', 'Moong Dal', ARRAY['green gram dal', 'yellow moong'], 'dal', true, '1 bowl (200ml)', 200, 140, 11, 22, 1, 4, 'ifct'),
('chana-dal', 'Chana Dal', ARRAY['bengal gram dal', 'split chickpea'], 'dal', true, '1 bowl (200ml)', 200, 170, 11, 26, 2, 5, 'ifct'),
('masoor-dal', 'Masoor Dal', ARRAY['red lentil dal'], 'dal', true, '1 bowl (200ml)', 200, 145, 10, 23, 1, 4, 'ifct'),
('rajma', 'Rajma', ARRAY['kidney beans', 'rajma masala'], 'dal', true, '1 bowl (200ml)', 200, 180, 9, 30, 1, 6, 'ifct'),
('chole', 'Chole / Chana Masala', ARRAY['chickpea curry', 'chole masala', 'chana'], 'dal', true, '1 bowl (200ml)', 200, 200, 9, 30, 5, 6, 'ifct'),
('dal-makhani', 'Dal Makhani', ARRAY['maa ki dal', 'black dal'], 'dal', true, '1 bowl (200ml)', 200, 220, 8, 25, 9, 5, 'ifct'),

-- Sabzi / Vegetables
('aloo-gobi', 'Aloo Gobi', ARRAY['potato cauliflower', 'gobi aloo'], 'sabzi', true, '1 bowl (150g)', 150, 130, 3, 18, 5, 3, 'ifct'),
('palak-paneer', 'Palak Paneer', ARRAY['spinach paneer', 'saag paneer'], 'sabzi', true, '1 bowl (150g)', 150, 200, 11, 8, 14, 2, 'ifct'),
('paneer-bhurji', 'Paneer Bhurji', ARRAY['scrambled paneer'], 'sabzi', true, '1 bowl (150g)', 150, 250, 14, 6, 18, 1, 'ifct'),
('mixed-veg-sabzi', 'Mixed Veg Sabzi', ARRAY['mix veg', 'mixed vegetable'], 'sabzi', true, '1 bowl (150g)', 150, 90, 3, 12, 4, 3, 'ifct'),
('bhindi-masala', 'Bhindi Masala', ARRAY['okra', 'lady finger'], 'sabzi', true, '1 bowl (150g)', 150, 100, 3, 10, 6, 3, 'ifct'),
('baingan-bharta', 'Baingan Bharta', ARRAY['roasted eggplant', 'brinjal bharta'], 'sabzi', true, '1 bowl (150g)', 150, 110, 3, 12, 6, 4, 'ifct'),
('matar-paneer', 'Matar Paneer', ARRAY['peas paneer'], 'sabzi', true, '1 bowl (150g)', 150, 220, 12, 14, 13, 3, 'ifct'),
('paneer-tikka', 'Paneer Tikka', ARRAY['grilled paneer', 'tandoori paneer'], 'sabzi', true, '1 serving (150g)', 150, 280, 18, 8, 20, 1, 'ifct'),
('soya-chunks-curry', 'Soya Chunks Curry', ARRAY['meal maker curry', 'soya masala'], 'sabzi', true, '1 bowl (150g)', 150, 180, 18, 14, 5, 3, 'ifct'),

-- Roti / Rice
('wheat-roti', 'Whole Wheat Roti', ARRAY['chapati', 'phulka', 'roti'], 'roti_rice', true, '1 roti', 35, 80, 3, 15, 1, 2, 'ifct'),
('rice', 'Rice', ARRAY['chawal', 'steamed rice', 'white rice'], 'roti_rice', true, '1 katori (150g)', 150, 180, 3, 40, 0.5, 0.5, 'ifct'),
('plain-paratha', 'Paratha (plain)', ARRAY['parantha'], 'roti_rice', true, '1 paratha', 50, 150, 4, 20, 7, 2, 'ifct'),
('multigrain-roti', 'Multigrain Roti', ARRAY['atta roti', 'multi atta chapati'], 'roti_rice', true, '1 roti', 40, 90, 4, 15, 2, 3, 'ifct'),

-- Eggs / Protein
('boiled-egg', 'Boiled Egg', ARRAY['anda', 'egg'], 'protein', false, '1 egg', 50, 70, 6, 1, 5, 0, 'ifct'),
('egg-bhurji', 'Egg Bhurji', ARRAY['scrambled eggs', 'anda bhurji'], 'protein', false, '2 eggs', 120, 180, 13, 3, 13, 0, 'ifct'),
('paneer-raw', 'Paneer (raw)', ARRAY['cottage cheese', 'paneer'], 'protein', true, '100g', 100, 265, 18, 4, 20, 0, 'ifct'),
('greek-yogurt', 'Greek Yogurt', ARRAY['hung curd', 'strained yogurt'], 'protein', true, '100g', 100, 60, 10, 4, 0.5, 0, 'ifct'),
('curd-dahi', 'Curd / Dahi', ARRAY['yogurt', 'dahi'], 'protein', true, '1 katori', 100, 60, 3, 5, 3, 0, 'ifct'),
('whey-protein', 'Whey Protein', ARRAY['protein shake', 'whey'], 'protein', true, '1 scoop (30g)', 30, 120, 24, 3, 1, 0, 'ifct'),
('soya-chunks-dry', 'Soya Chunks (dry)', ARRAY['meal maker', 'soy nuggets', 'nutrela'], 'protein', true, '50g dry', 50, 170, 26, 16, 0.5, 7, 'ifct'),

-- Breakfast
('poha', 'Poha', ARRAY['flattened rice', 'chivda'], 'breakfast', true, '1 plate', 200, 180, 4, 30, 5, 2, 'ifct'),
('upma', 'Upma', ARRAY['suji upma', 'rava upma'], 'breakfast', true, '1 plate', 200, 200, 5, 28, 8, 2, 'ifct'),
('moong-dal-cheela', 'Moong Dal Cheela', ARRAY['moong chilla', 'dal cheela'], 'breakfast', true, '2 pieces', 150, 160, 10, 20, 4, 3, 'ifct'),
('idli', 'Idli', ARRAY['steamed idli'], 'breakfast', true, '2 pieces', 120, 140, 4, 28, 1, 1, 'ifct'),
('besan-cheela', 'Besan Cheela', ARRAY['gram flour pancake', 'besan chilla'], 'breakfast', true, '2 pieces', 150, 200, 12, 22, 7, 4, 'ifct'),
('oats-milk', 'Oats with Milk', ARRAY['oatmeal', 'porridge'], 'breakfast', true, '1 bowl', 250, 220, 10, 32, 5, 4, 'ifct'),

-- Fruits / Snacks
('banana', 'Banana', ARRAY['kela'], 'fruits_snacks', true, '1 medium', 120, 105, 1, 27, 0.4, 3, 'ifct'),
('apple', 'Apple', ARRAY['seb'], 'fruits_snacks', true, '1 medium', 180, 80, 0.5, 21, 0.3, 4, 'ifct'),
('makhana', 'Makhana', ARRAY['fox nuts', 'lotus seeds'], 'fruits_snacks', true, '30g', 30, 110, 3, 20, 0.7, 1, 'ifct'),
('mixed-nuts', 'Mixed Nuts', ARRAY['dry fruits', 'trail mix', 'nuts'], 'fruits_snacks', true, '30g', 30, 180, 5, 7, 16, 2, 'ifct'),
('peanut-butter', 'Peanut Butter', ARRAY['pb'], 'fruits_snacks', true, '1 tbsp (16g)', 16, 95, 4, 3, 8, 1, 'ifct'),

-- Drinks
('milk', 'Milk', ARRAY['doodh', 'full cream milk'], 'drinks', true, '200ml', 200, 120, 6, 10, 6, 0, 'ifct'),
('chaas', 'Chaas / Buttermilk', ARRAY['buttermilk', 'mattha', 'lassi'], 'drinks', true, '200ml', 200, 40, 2, 5, 1, 0, 'ifct'),
('black-coffee', 'Black Coffee', ARRAY['coffee', 'espresso'], 'drinks', true, '1 cup', 200, 5, 0, 0, 0, 0, 'ifct'),
('tea-with-milk', 'Tea with Milk', ARRAY['chai', 'masala chai'], 'drinks', true, '1 cup', 150, 30, 1, 4, 1, 0, 'ifct')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  aliases = EXCLUDED.aliases,
  category = EXCLUDED.category,
  is_vegetarian = EXCLUDED.is_vegetarian,
  serving_size = EXCLUDED.serving_size,
  serving_grams = EXCLUDED.serving_grams,
  calories = EXCLUDED.calories,
  protein_g = EXCLUDED.protein_g,
  carbs_g = EXCLUDED.carbs_g,
  fat_g = EXCLUDED.fat_g,
  fiber_g = EXCLUDED.fiber_g,
  source = EXCLUDED.source;
