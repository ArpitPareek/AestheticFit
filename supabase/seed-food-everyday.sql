-- seed-food-everyday.sql
-- Curated "everyday" foods that IFCT (Indian raw-ingredient composition data)
-- does NOT cover: cooked Indian dishes, cafe/Western items, packaged foods,
-- beverages, sweets. Fills the gap so common meals resolve from the DB instead
-- of always asking the AI.
--
-- id = kebab-slug (never collides with IFCT's UPPERCASE codes).
-- source = 'manual' (curated), macros are standard reference values.
-- Macros correspond to `serving_grams` (NOT always 100 g) — the parser scales
-- by grams, so serving_grams can be a realistic single-serving weight.
-- portion_conversions map the household unit the parser emits (piece/katori/
-- plate/glass/cup/tbsp/tsp) → grams, so "2 roti" or "1 cutting chai" is accurate.
--
-- Idempotent: ON CONFLICT refreshes. RUN THE WHOLE FILE in the Supabase SQL editor.

-- ─── food_library ────────────────────────────────────────────────────────────
insert into food_library
  (id, name, aliases, category, is_vegetarian, serving_size, serving_grams,
   calories, protein_g, carbs_g, fat_g, fiber_g, source)
values
-- Breads & bakery ------------------------------------------------------------
('croissant', 'Croissant', ARRAY['plain croissant','butter croissant']::text[], 'Bakery', true, '1 croissant (57 g)', 57, 231, 4.7, 26, 12, 1.5, 'manual'),
('chocolate-croissant', 'Chocolate croissant', ARRAY['pain au chocolat','choco croissant']::text[], 'Bakery', true, '1 piece (70 g)', 70, 300, 5, 34, 16, 2, 'manual'),
('white-bread-slice', 'White bread slice', ARRAY['bread','white bread','sandwich bread']::text[], 'Bakery', true, '1 slice (25 g)', 25, 66, 2, 12.5, 0.8, 0.6, 'manual'),
('brown-bread-slice', 'Brown bread slice', ARRAY['brown bread','wheat bread']::text[], 'Bakery', true, '1 slice (28 g)', 28, 69, 2.7, 12, 1, 1.4, 'manual'),
('multigrain-bread-slice', 'Multigrain bread slice', ARRAY['multigrain bread']::text[], 'Bakery', true, '1 slice (30 g)', 30, 80, 3.5, 13, 1.2, 2, 'manual'),
('pav', 'Pav', ARRAY['ladi pav','bun pav']::text[], 'Bakery', true, '1 pav (40 g)', 40, 110, 3.5, 21, 1.2, 0.9, 'manual'),
('bun', 'Bun', ARRAY['bread bun','burger bun']::text[], 'Bakery', true, '1 bun (45 g)', 45, 130, 4, 24, 2, 1, 'manual'),
('bagel', 'Bagel', ARRAY['plain bagel']::text[], 'Bakery', true, '1 bagel (100 g)', 100, 250, 10, 48, 1.5, 2, 'manual'),
('muffin', 'Muffin', ARRAY['choc chip muffin']::text[], 'Bakery', true, '1 muffin (110 g)', 110, 380, 5, 50, 18, 1.5, 'manual'),
('donut', 'Donut', ARRAY['doughnut','glazed donut']::text[], 'Bakery', true, '1 donut (60 g)', 60, 250, 3, 30, 14, 1, 'manual'),
('cookie', 'Cookie', ARRAY['choc chip cookie']::text[], 'Bakery', true, '1 cookie (12 g)', 12, 55, 0.7, 7.5, 2.5, 0.2, 'manual'),
('rusk', 'Rusk', ARRAY['toast rusk','cake rusk']::text[], 'Bakery', true, '1 rusk (10 g)', 10, 40, 1, 7, 0.9, 0.3, 'manual'),
-- Indian breads (cooked) -----------------------------------------------------
('roti', 'Roti', ARRAY['chapati','phulka','wheat roti']::text[], 'Indian breads', true, '1 medium roti (35 g)', 35, 104, 3, 20, 1.5, 2, 'manual'),
('paratha-plain', 'Paratha', ARRAY['plain paratha','sada paratha']::text[], 'Indian breads', true, '1 paratha (60 g)', 60, 200, 4.5, 28, 8, 2.5, 'manual'),
('aloo-paratha', 'Aloo paratha', ARRAY['potato paratha']::text[], 'Indian breads', true, '1 paratha (120 g)', 120, 300, 6, 40, 12, 4, 'manual'),
('puri', 'Puri', ARRAY['poori']::text[], 'Indian breads', true, '1 puri (20 g)', 20, 85, 1.6, 10, 4.3, 0.6, 'manual'),
('naan', 'Naan', ARRAY['plain naan','butter naan']::text[], 'Indian breads', true, '1 naan (90 g)', 90, 260, 7, 45, 5, 2, 'manual'),
-- Rice & grains (cooked) -----------------------------------------------------
('rice-cooked', 'Cooked rice', ARRAY['plain rice','steamed rice','white rice','chawal']::text[], 'Rice & grains', true, '1 katori (150 g)', 150, 195, 4, 42, 0.5, 0.6, 'manual'),
('jeera-rice', 'Jeera rice', ARRAY['cumin rice']::text[], 'Rice & grains', true, '1 katori (150 g)', 150, 248, 4.5, 45, 5.3, 0.9, 'manual'),
('veg-biryani', 'Veg biryani', ARRAY['vegetable biryani','veg pulao']::text[], 'Rice & grains', true, '1 plate (300 g)', 300, 510, 10.5, 78, 16.5, 3.6, 'manual'),
('chicken-biryani', 'Chicken biryani', ARRAY['murgh biryani']::text[], 'Rice & grains', false, '1 plate (300 g)', 300, 600, 24, 78, 21, 3, 'manual'),
('khichdi', 'Khichdi', ARRAY['dal khichdi','moong khichdi']::text[], 'Rice & grains', true, '1 katori (200 g)', 200, 240, 8, 40, 5, 3, 'manual'),
('curd-rice', 'Curd rice', ARRAY['dahi rice','thayir sadam']::text[], 'Rice & grains', true, '1 katori (200 g)', 200, 260, 6, 44, 6, 1, 'manual'),
('poha', 'Poha', ARRAY['pohe','flattened rice dish']::text[], 'Rice & grains', true, '1 katori (180 g)', 180, 234, 4.5, 43, 5.4, 1.8, 'manual'),
('upma', 'Upma', ARRAY['uppma','rava upma']::text[], 'Rice & grains', true, '1 katori (180 g)', 180, 234, 5.4, 36, 7.2, 2.7, 'manual'),
-- Dals & legumes (cooked) ----------------------------------------------------
('dal-cooked', 'Dal', ARRAY['plain dal','cooked dal','dal cooked']::text[], 'Dals & curries', true, '1 katori (150 g)', 150, 158, 9, 22.5, 3, 4.5, 'manual'),
('dal-fry', 'Dal fry', ARRAY['dal tadka','tadka dal']::text[], 'Dals & curries', true, '1 katori (150 g)', 150, 180, 9, 22.5, 6, 4.5, 'manual'),
('moong-dal-cooked', 'Moong dal', ARRAY['yellow moong dal','mung dal']::text[], 'Dals & curries', true, '1 katori (150 g)', 150, 150, 9, 21, 2.5, 4.5, 'manual'),
('rajma', 'Rajma', ARRAY['kidney beans curry','rajma masala']::text[], 'Dals & curries', true, '1 katori (150 g)', 150, 210, 10.5, 30, 4.5, 9, 'manual'),
('chole', 'Chole', ARRAY['chana masala','chickpea curry','chhole']::text[], 'Dals & curries', true, '1 katori (150 g)', 150, 240, 10.5, 33, 7.5, 9, 'manual'),
('sambar', 'Sambar', ARRAY['sambhar']::text[], 'Dals & curries', true, '1 katori (150 g)', 150, 128, 6, 16.5, 3.8, 4.5, 'manual'),
-- Vegetable dishes -----------------------------------------------------------
('mixed-veg-sabzi', 'Mixed veg sabzi', ARRAY['mix veg','vegetable sabzi','sabji']::text[], 'Vegetable dishes', true, '1 katori (150 g)', 150, 165, 4.5, 18, 9, 4.5, 'manual'),
('aloo-sabzi', 'Aloo sabzi', ARRAY['potato sabzi','aloo curry']::text[], 'Vegetable dishes', true, '1 katori (150 g)', 150, 180, 3, 22.5, 9, 3, 'manual'),
('bhindi-fry', 'Bhindi fry', ARRAY['okra fry','ladyfinger sabzi']::text[], 'Vegetable dishes', true, '1 katori (150 g)', 150, 195, 3.3, 13.5, 13.5, 4.8, 'manual'),
('palak-paneer', 'Palak paneer', ARRAY['spinach paneer']::text[], 'Vegetable dishes', true, '1 katori (150 g)', 150, 270, 12, 9, 21, 3, 'manual'),
('paneer-butter-masala', 'Paneer butter masala', ARRAY['paneer makhani','shahi paneer']::text[], 'Vegetable dishes', true, '1 katori (150 g)', 150, 345, 12, 12, 27, 2.3, 'manual'),
-- South Indian ---------------------------------------------------------------
('idli', 'Idli', ARRAY['idly']::text[], 'South Indian', true, '1 idli (40 g)', 40, 58, 2, 12, 0.4, 0.6, 'manual'),
('dosa-plain', 'Plain dosa', ARRAY['dosa','sada dosa']::text[], 'South Indian', true, '1 dosa (80 g)', 80, 165, 3.5, 28, 4, 1.2, 'manual'),
('masala-dosa', 'Masala dosa', ARRAY['masaladosa']::text[], 'South Indian', true, '1 dosa (150 g)', 150, 290, 5.5, 44, 10, 2.5, 'manual'),
('medu-vada', 'Medu vada', ARRAY['vada','urad vada']::text[], 'South Indian', true, '1 vada (40 g)', 40, 130, 3, 14, 7, 1.2, 'manual'),
('uttapam', 'Uttapam', ARRAY['uthappam']::text[], 'South Indian', true, '1 uttapam (100 g)', 100, 180, 4, 30, 5, 1.5, 'manual'),
-- Snacks (Indian) ------------------------------------------------------------
('besan-chilla', 'Besan chilla', ARRAY['chilla','besan cheela','pudla']::text[], 'Snacks', true, '1 chilla (60 g)', 60, 120, 5, 12, 5, 2, 'manual'),
('samosa', 'Samosa', ARRAY['samosaa']::text[], 'Snacks', true, '1 samosa (60 g)', 60, 180, 3.5, 22, 9, 2, 'manual'),
('kachori', 'Kachori', ARRAY['kachauri']::text[], 'Snacks', true, '1 kachori (50 g)', 50, 190, 4, 20, 10, 2, 'manual'),
('pakora', 'Pakora', ARRAY['pakoda','bhajji','bhajiya']::text[], 'Snacks', true, '1 piece (20 g)', 20, 65, 1.5, 6, 4, 1, 'manual'),
('dhokla', 'Dhokla', ARRAY['khaman dhokla']::text[], 'Snacks', true, '1 piece (50 g)', 50, 80, 3, 12, 2, 1, 'manual'),
('vada-pav', 'Vada pav', ARRAY['wada pav']::text[], 'Snacks', false, '1 vada pav (150 g)', 150, 290, 6.5, 42, 11, 3, 'manual'),
-- Eggs (cooked) --------------------------------------------------------------
('boiled-egg', 'Boiled egg', ARRAY['egg boiled','uble ande']::text[], 'Eggs', false, '1 egg (50 g)', 50, 78, 6.3, 0.6, 5.3, 0, 'manual'),
('omelette', 'Omelette', ARRAY['omelet','anda omelette']::text[], 'Eggs', false, '2-egg omelette (120 g)', 120, 220, 13, 2, 17, 0, 'manual'),
('egg-bhurji', 'Egg bhurji', ARRAY['anda bhurji','scrambled egg']::text[], 'Eggs', false, '1 katori (120 g)', 120, 204, 13.2, 3.6, 14.4, 0.6, 'manual'),
('egg-curry', 'Egg curry', ARRAY['anda curry']::text[], 'Eggs', false, '1 katori (150 g)', 150, 195, 10.5, 7.5, 13.5, 1.5, 'manual'),
-- Chicken / meat / fish (cooked) --------------------------------------------
('chicken-curry', 'Chicken curry', ARRAY['murgh curry','chicken masala','chicken gravy']::text[], 'Non-veg curries', false, '1 katori (150 g)', 150, 270, 22.5, 7.5, 16.5, 1.5, 'manual'),
('butter-chicken', 'Butter chicken', ARRAY['murgh makhani','chicken makhani']::text[], 'Non-veg curries', false, '1 katori (150 g)', 150, 360, 24, 9, 25.5, 1.5, 'manual'),
('chicken-tikka', 'Chicken tikka', ARRAY['tikka','chicken tikka dry']::text[], 'Non-veg curries', false, '1 plate (150 g)', 150, 293, 37.5, 4.5, 13.5, 0.8, 'manual'),
('tandoori-chicken', 'Tandoori chicken', ARRAY['tandoori']::text[], 'Non-veg curries', false, '1 plate (150 g)', 150, 263, 40.5, 3, 10.5, 0, 'manual'),
('grilled-chicken-breast', 'Grilled chicken breast', ARRAY['chicken breast','boiled chicken']::text[], 'Non-veg curries', false, '100 g', 100, 165, 31, 0, 3.6, 0, 'manual'),
('fish-curry', 'Fish curry', ARRAY['machli curry','fish gravy']::text[], 'Non-veg curries', false, '1 katori (150 g)', 150, 195, 21, 6, 9, 0.8, 'manual'),
('fish-fry', 'Fish fry', ARRAY['fried fish','tawa fish']::text[], 'Non-veg curries', false, '1 piece (100 g)', 100, 200, 20, 8, 10, 0.5, 'manual'),
('mutton-curry', 'Mutton curry', ARRAY['gosht curry','lamb curry']::text[], 'Non-veg curries', false, '1 katori (150 g)', 150, 375, 27, 6, 27, 0.8, 'manual'),
('prawns-cooked', 'Cooked prawns', ARRAY['jhinga','shrimp']::text[], 'Non-veg curries', false, '100 g', 100, 99, 24, 0.2, 0.3, 0, 'manual'),
-- Fast food & Indo-Chinese ---------------------------------------------------
('veg-burger', 'Veg burger', ARRAY['aloo tikki burger']::text[], 'Fast food', true, '1 burger (150 g)', 150, 300, 9, 42, 11, 3, 'manual'),
('chicken-burger', 'Chicken burger', ARRAY['chicken zinger']::text[], 'Fast food', false, '1 burger (180 g)', 180, 400, 20, 40, 18, 2, 'manual'),
('french-fries', 'French fries', ARRAY['fries','finger chips']::text[], 'Fast food', true, '1 plate (100 g)', 100, 312, 3.4, 41, 15, 4, 'manual'),
('pizza-slice', 'Pizza slice', ARRAY['pizza','margherita pizza','cheese pizza']::text[], 'Fast food', true, '1 slice (100 g)', 100, 260, 11, 33, 9, 2, 'manual'),
('veg-sandwich', 'Veg sandwich', ARRAY['sandwich','vegetable sandwich']::text[], 'Fast food', true, '1 sandwich (120 g)', 120, 250, 8, 34, 9, 3, 'manual'),
('grilled-sandwich', 'Grilled cheese sandwich', ARRAY['cheese sandwich','grilled sandwich']::text[], 'Fast food', true, '1 sandwich (150 g)', 150, 300, 10, 38, 12, 3, 'manual'),
('maggi', 'Maggi noodles', ARRAY['instant noodles','maggie','2-minute noodles']::text[], 'Fast food', true, '1 plate (150 g)', 150, 300, 6, 43.5, 11.3, 1.8, 'manual'),
('hakka-noodles', 'Hakka noodles', ARRAY['veg noodles','chowmein','chow mein']::text[], 'Fast food', true, '1 plate (200 g)', 200, 360, 10, 56, 10, 4, 'manual'),
('fried-rice', 'Fried rice', ARRAY['veg fried rice','chinese rice']::text[], 'Fast food', true, '1 plate (250 g)', 250, 413, 8.8, 70, 11.3, 3, 'manual'),
('veg-manchurian', 'Veg manchurian', ARRAY['manchurian','gobi manchurian']::text[], 'Fast food', true, '1 katori (150 g)', 150, 270, 6, 30, 13.5, 3, 'manual'),
('momos-veg', 'Veg momos', ARRAY['momo','dumpling','veg momo']::text[], 'Fast food', true, '1 piece (25 g)', 25, 35, 1.2, 6, 0.7, 0.4, 'manual'),
('momos-chicken', 'Chicken momos', ARRAY['chicken momo']::text[], 'Fast food', false, '1 piece (25 g)', 25, 40, 2, 5, 1, 0.3, 'manual'),
('spring-roll', 'Spring roll', ARRAY['veg spring roll']::text[], 'Fast food', true, '1 roll (60 g)', 60, 150, 3, 20, 6, 1.5, 'manual'),
('pasta-white-sauce', 'White sauce pasta', ARRAY['pasta','alfredo pasta','creamy pasta']::text[], 'Fast food', true, '1 plate (250 g)', 250, 450, 12.5, 60, 17.5, 3.8, 'manual'),
('pasta-red-sauce', 'Red sauce pasta', ARRAY['arrabiata pasta','tomato pasta']::text[], 'Fast food', true, '1 plate (250 g)', 250, 350, 11.3, 60, 7.5, 5, 'manual'),
-- Dairy & alternatives -------------------------------------------------------
('milk-toned', 'Toned milk', ARRAY['milk','doodh','cow milk']::text[], 'Dairy', true, '1 glass (200 ml)', 200, 116, 6.2, 9.4, 6, 0, 'manual'),
('milk-full-cream', 'Full cream milk', ARRAY['whole milk','full fat milk']::text[], 'Dairy', true, '1 glass (200 ml)', 200, 124, 6.4, 9.2, 6.8, 0, 'manual'),
('milk-skimmed', 'Skimmed milk', ARRAY['double toned milk','skim milk']::text[], 'Dairy', true, '1 glass (200 ml)', 200, 70, 6.6, 9.8, 0.4, 0, 'manual'),
('curd', 'Curd', ARRAY['dahi','yogurt','plain curd']::text[], 'Dairy', true, '1 katori (150 g)', 150, 90, 4.7, 6, 5, 0, 'manual'),
('greek-yogurt', 'Greek yogurt', ARRAY['hung curd','greek yoghurt']::text[], 'Dairy', true, '1 katori (150 g)', 150, 146, 13.5, 6, 7.5, 0, 'manual'),
('paneer', 'Paneer', ARRAY['cottage cheese','panir']::text[], 'Dairy', true, '100 g', 100, 265, 18, 3.5, 20, 0, 'manual'),
('tofu', 'Tofu', ARRAY['soy paneer','bean curd']::text[], 'Dairy', true, '100 g', 100, 76, 8, 1.9, 4.8, 0.3, 'manual'),
('cheese-slice', 'Cheese slice', ARRAY['processed cheese','cheese']::text[], 'Dairy', true, '1 slice (20 g)', 20, 60, 3.5, 1, 4.5, 0, 'manual'),
('mozzarella', 'Mozzarella cheese', ARRAY['pizza cheese']::text[], 'Dairy', true, '100 g', 100, 280, 22, 2.2, 20, 0, 'manual'),
('butter', 'Butter', ARRAY['makkhan','amul butter']::text[], 'Dairy', true, '1 tbsp (14 g)', 14, 100, 0.1, 0, 11.4, 0, 'manual'),
('ghee', 'Ghee', ARRAY['clarified butter','desi ghee']::text[], 'Dairy', true, '1 tbsp (14 g)', 14, 126, 0, 0, 14, 0, 'manual'),
('soy-milk', 'Soy milk', ARRAY['soya milk']::text[], 'Dairy', true, '1 glass (200 ml)', 200, 108, 6.6, 12, 3.6, 1.2, 'manual'),
('almond-milk', 'Almond milk', ARRAY['badam milk unsweetened']::text[], 'Dairy', true, '1 glass (200 ml)', 200, 30, 1, 1.2, 2.2, 0.4, 'manual'),
('buttermilk', 'Buttermilk', ARRAY['chaas','chhachh','mattha']::text[], 'Dairy', true, '1 glass (200 ml)', 200, 40, 3, 5, 1.6, 0, 'manual'),
('whey-protein', 'Whey protein', ARRAY['whey scoop','protein powder','whey']::text[], 'Supplements', true, '1 scoop (30 g)', 30, 120, 24, 3, 1.5, 0, 'manual'),
-- Breakfast staples ----------------------------------------------------------
('oats-dry', 'Oats (dry)', ARRAY['rolled oats','oatmeal','oats']::text[], 'Breakfast', true, '100 g dry', 100, 379, 13, 68, 6.5, 10, 'manual'),
('muesli', 'Muesli', ARRAY['fruit muesli']::text[], 'Breakfast', true, '100 g', 100, 360, 10, 66, 6, 7, 'manual'),
('cornflakes', 'Cornflakes', ARRAY['corn flakes']::text[], 'Breakfast', true, '100 g', 100, 378, 7.5, 84, 0.4, 3, 'manual'),
('granola', 'Granola', ARRAY['baked granola']::text[], 'Breakfast', true, '100 g', 100, 471, 10, 64, 20, 7, 'manual'),
('peanut-butter', 'Peanut butter', ARRAY['pb','groundnut butter']::text[], 'Spreads', true, '1 tbsp (16 g)', 16, 94, 4, 3.2, 8, 1, 'manual'),
('jam', 'Jam', ARRAY['mixed fruit jam','marmalade']::text[], 'Spreads', true, '1 tbsp (20 g)', 20, 50, 0.1, 12.4, 0, 0.2, 'manual'),
('honey', 'Honey', ARRAY['shahad']::text[], 'Spreads', true, '1 tbsp (21 g)', 21, 64, 0.1, 17.2, 0, 0, 'manual'),
('tomato-ketchup', 'Tomato ketchup', ARRAY['ketchup','tomato sauce']::text[], 'Condiments', true, '1 tbsp (17 g)', 17, 19, 0.2, 4.4, 0.1, 0.1, 'manual'),
-- Sweets & desserts ----------------------------------------------------------
('gulab-jamun', 'Gulab jamun', ARRAY['gulabjamun']::text[], 'Sweets', true, '1 piece (40 g)', 40, 150, 2, 21, 7, 0.3, 'manual'),
('rasgulla', 'Rasgulla', ARRAY['rosogolla']::text[], 'Sweets', true, '1 piece (50 g)', 50, 106, 2, 20, 2, 0, 'manual'),
('jalebi', 'Jalebi', ARRAY['jilebi']::text[], 'Sweets', true, '1 piece (30 g)', 30, 120, 0.8, 22, 3.5, 0.2, 'manual'),
('laddu', 'Laddu', ARRAY['ladoo','besan laddu']::text[], 'Sweets', true, '1 piece (40 g)', 40, 180, 3, 22, 9, 1, 'manual'),
('barfi', 'Barfi', ARRAY['burfi','milk barfi']::text[], 'Sweets', true, '1 piece (30 g)', 30, 130, 2.5, 15, 7, 0.3, 'manual'),
('kheer', 'Kheer', ARRAY['payasam','rice pudding']::text[], 'Sweets', true, '1 katori (150 g)', 150, 195, 5.3, 30, 6, 0.5, 'manual'),
('ice-cream', 'Ice cream', ARRAY['vanilla ice cream']::text[], 'Sweets', true, '1 scoop (60 g)', 60, 124, 2.1, 14.4, 6.6, 0.4, 'manual'),
('dark-chocolate', 'Dark chocolate', ARRAY['70% dark chocolate']::text[], 'Sweets', true, '100 g', 100, 546, 5, 61, 31, 7, 'manual'),
('milk-chocolate', 'Milk chocolate', ARRAY['chocolate','dairy milk']::text[], 'Sweets', true, '100 g', 100, 535, 7.6, 59, 30, 3.4, 'manual'),
-- Packaged snacks ------------------------------------------------------------
('potato-chips', 'Potato chips', ARRAY['chips','lays','wafers']::text[], 'Packaged snacks', true, '1 packet (30 g)', 30, 160, 2, 15, 10, 1.3, 'manual'),
('namkeen', 'Namkeen', ARRAY['mixture','sev','farsan']::text[], 'Packaged snacks', true, '30 g', 30, 160, 4, 15, 9, 1.5, 'manual'),
('marie-biscuit', 'Marie biscuit', ARRAY['marie','tea biscuit']::text[], 'Packaged snacks', true, '1 biscuit (5 g)', 5, 22, 0.4, 4, 0.6, 0.1, 'manual'),
('parle-g', 'Parle-G biscuit', ARRAY['glucose biscuit','parle g']::text[], 'Packaged snacks', true, '1 biscuit (5.5 g)', 5.5, 25, 0.4, 4.2, 0.8, 0, 'manual'),
('digestive-biscuit', 'Digestive biscuit', ARRAY['digestive']::text[], 'Packaged snacks', true, '1 biscuit (15 g)', 15, 70, 1, 10, 3, 0.5, 'manual'),
('protein-bar', 'Protein bar', ARRAY['protein bar']::text[], 'Packaged snacks', true, '1 bar (60 g)', 60, 220, 20, 22, 7, 3, 'manual'),
('granola-bar', 'Granola bar', ARRAY['cereal bar','energy bar']::text[], 'Packaged snacks', true, '1 bar (40 g)', 40, 180, 4, 29, 6, 2, 'manual'),
('banana-chips', 'Banana chips', ARRAY['kela chips']::text[], 'Packaged snacks', true, '30 g', 30, 160, 0.7, 17, 10, 1.5, 'manual'),
-- Beverages ------------------------------------------------------------------
('chai', 'Chai', ARRAY['tea','masala chai','milk tea','cutting chai','chai cutting']::text[], 'Beverages', true, '1 cup (150 ml)', 150, 90, 2.2, 13, 3, 0, 'manual'),
('black-tea', 'Black tea', ARRAY['tea without milk','kali chai','black tea no sugar']::text[], 'Beverages', true, '1 cup (150 ml)', 150, 3, 0, 0.7, 0, 0, 'manual'),
('green-tea', 'Green tea', ARRAY['green chai']::text[], 'Beverages', true, '1 cup (150 ml)', 150, 3, 0, 0.6, 0, 0, 'manual'),
('filter-coffee', 'Filter coffee', ARRAY['coffee','south indian coffee','milk coffee']::text[], 'Beverages', true, '1 cup (150 ml)', 150, 90, 2.7, 12, 3.3, 0, 'manual'),
('black-coffee', 'Black coffee', ARRAY['coffee without milk','kali coffee']::text[], 'Beverages', true, '1 cup (150 ml)', 150, 5, 0.3, 1, 0, 0, 'manual'),
('latte', 'Cafe latte', ARRAY['latte','caffe latte']::text[], 'Beverages', true, '1 cup (240 ml)', 240, 120, 8, 12, 4.5, 0, 'manual'),
('cappuccino', 'Cappuccino', ARRAY['cappucino']::text[], 'Beverages', true, '1 cup (180 ml)', 180, 80, 4.5, 8, 3.5, 0, 'manual'),
('cold-coffee', 'Cold coffee', ARRAY['iced coffee','coffee shake']::text[], 'Beverages', true, '1 glass (250 ml)', 250, 180, 6, 26, 6, 0, 'manual'),
('lassi-sweet', 'Sweet lassi', ARRAY['lassi','meethi lassi']::text[], 'Beverages', true, '1 glass (250 ml)', 250, 225, 6.5, 37.5, 6.3, 0, 'manual'),
('lassi-salted', 'Salted lassi', ARRAY['namkeen lassi']::text[], 'Beverages', true, '1 glass (250 ml)', 250, 113, 6.3, 10, 5.5, 0, 'manual'),
('mango-shake', 'Mango shake', ARRAY['mango milkshake']::text[], 'Beverages', true, '1 glass (250 ml)', 250, 225, 5, 37.5, 6.3, 0.8, 'manual'),
('banana-shake', 'Banana shake', ARRAY['banana milkshake']::text[], 'Beverages', true, '1 glass (250 ml)', 250, 238, 6.3, 40, 6.3, 1, 'manual'),
('orange-juice', 'Orange juice', ARRAY['fresh orange juice','santra juice']::text[], 'Beverages', true, '1 glass (200 ml)', 200, 90, 1.4, 20, 0.4, 0.4, 'manual'),
('coconut-water', 'Coconut water', ARRAY['nariyal pani']::text[], 'Beverages', true, '1 glass (200 ml)', 200, 38, 1.4, 7.4, 0.4, 2.2, 'manual'),
('nimbu-pani', 'Nimbu pani', ARRAY['lemonade','lemon water','shikanji']::text[], 'Beverages', true, '1 glass (200 ml)', 200, 50, 0.2, 13, 0, 0, 'manual'),
('soft-drink', 'Soft drink', ARRAY['cola','coke','pepsi','soda','aerated drink']::text[], 'Beverages', true, '1 glass (200 ml)', 200, 84, 0, 21.2, 0, 0, 'manual'),
-- Nuts & dry fruits ----------------------------------------------------------
('almonds', 'Almonds', ARRAY['badam']::text[], 'Nuts', true, '1 handful (15 g)', 15, 87, 3.2, 3.3, 7.5, 1.9, 'manual'),
('walnuts', 'Walnuts', ARRAY['akhrot']::text[], 'Nuts', true, '1 handful (15 g)', 15, 98, 2.3, 2.1, 9.8, 1, 'manual'),
('cashews', 'Cashews', ARRAY['kaju']::text[], 'Nuts', true, '1 handful (15 g)', 15, 83, 2.7, 4.5, 6.6, 0.5, 'manual'),
('peanuts', 'Peanuts', ARRAY['groundnut','moongphali']::text[], 'Nuts', true, '1 handful (15 g)', 15, 85, 3.9, 2.4, 7.4, 1.3, 'manual'),
('dates', 'Dates', ARRAY['khajoor','khajur']::text[], 'Nuts', true, '1 piece (8 g)', 8, 22, 0.1, 6, 0, 0.6, 'manual')
on conflict (id) do update set
  name = excluded.name, aliases = excluded.aliases, category = excluded.category,
  is_vegetarian = excluded.is_vegetarian, serving_size = excluded.serving_size,
  serving_grams = excluded.serving_grams, calories = excluded.calories,
  protein_g = excluded.protein_g, carbs_g = excluded.carbs_g, fat_g = excluded.fat_g,
  fiber_g = excluded.fiber_g, source = excluded.source;

-- ─── portion_conversions ─────────────────────────────────────────────────────
-- Household unit → grams, for the units the parser emits. Where a food's
-- serving_grams already equals one natural unit, we still record it so the
-- parser resolves that unit exactly instead of falling back.
insert into portion_conversions (food_id, unit, grams_equivalent) values
-- breads / bakery: piece
('croissant','piece',57),('chocolate-croissant','piece',70),
('white-bread-slice','piece',25),('brown-bread-slice','piece',28),('multigrain-bread-slice','piece',30),
('pav','piece',40),('bun','piece',45),('bagel','piece',100),('muffin','piece',110),
('donut','piece',60),('cookie','piece',12),('rusk','piece',10),
('roti','piece',35),('paratha-plain','piece',60),('aloo-paratha','piece',120),
('puri','piece',20),('naan','piece',90),
-- rice/grains: katori & plate
('rice-cooked','katori',150),('rice-cooked','plate',300),
('jeera-rice','katori',150),('veg-biryani','plate',300),('chicken-biryani','plate',300),
('khichdi','katori',200),('curd-rice','katori',200),('poha','katori',180),('upma','katori',180),
-- dals / curries: katori
('dal-cooked','katori',150),('dal-fry','katori',150),('moong-dal-cooked','katori',150),
('rajma','katori',150),('chole','katori',150),('sambar','katori',150),
('mixed-veg-sabzi','katori',150),('aloo-sabzi','katori',150),('bhindi-fry','katori',150),
('palak-paneer','katori',150),('paneer-butter-masala','katori',150),
-- south indian / snacks: piece
('idli','piece',40),('dosa-plain','piece',80),('masala-dosa','piece',150),
('medu-vada','piece',40),('uttapam','piece',100),('besan-chilla','piece',60),
('samosa','piece',60),('kachori','piece',50),('pakora','piece',20),('dhokla','piece',50),
('vada-pav','piece',150),
-- eggs
('boiled-egg','piece',50),('omelette','piece',120),('egg-bhurji','katori',120),('egg-curry','katori',150),
-- non-veg curries
('chicken-curry','katori',150),('butter-chicken','katori',150),('chicken-tikka','plate',150),
('tandoori-chicken','plate',150),('grilled-chicken-breast','piece',100),
('fish-curry','katori',150),('fish-fry','piece',100),('mutton-curry','katori',150),('prawns-cooked','katori',100),
-- fast food
('veg-burger','piece',150),('chicken-burger','piece',180),('french-fries','plate',100),
('pizza-slice','piece',100),('veg-sandwich','piece',120),('grilled-sandwich','piece',150),
('maggi','plate',150),('hakka-noodles','plate',200),('fried-rice','plate',250),
('veg-manchurian','katori',150),('momos-veg','piece',25),('momos-chicken','piece',25),
('spring-roll','piece',60),('pasta-white-sauce','plate',250),('pasta-red-sauce','plate',250),
-- dairy: glass / katori / tbsp / scoop
('milk-toned','glass',200),('milk-toned','cup',150),('milk-full-cream','glass',200),
('milk-skimmed','glass',200),('curd','katori',150),('greek-yogurt','katori',150),
('paneer','katori',100),('tofu','katori',100),('cheese-slice','piece',20),
('butter','tbsp',14),('butter','tsp',5),('ghee','tbsp',14),('ghee','tsp',5),
('soy-milk','glass',200),('almond-milk','glass',200),('buttermilk','glass',200),
('whey-protein','scoop',30),
-- breakfast / spreads
('oats-dry','katori',40),('muesli','katori',50),('cornflakes','katori',30),('granola','katori',45),
('peanut-butter','tbsp',16),('peanut-butter','tsp',6),('jam','tbsp',20),('jam','tsp',7),
('honey','tbsp',21),('honey','tsp',7),('tomato-ketchup','tbsp',17),('tomato-ketchup','tsp',6),
-- sweets
('gulab-jamun','piece',40),('rasgulla','piece',50),('jalebi','piece',30),('laddu','piece',40),
('barfi','piece',30),('kheer','katori',150),('ice-cream','scoop',60),
-- packaged snacks
('marie-biscuit','piece',5),('parle-g','piece',5.5),('digestive-biscuit','piece',15),
('protein-bar','piece',60),('granola-bar','piece',40),
-- beverages: cup / glass
('chai','cup',150),('chai','glass',100),('black-tea','cup',150),('green-tea','cup',150),
('filter-coffee','cup',150),('black-coffee','cup',150),('latte','cup',240),('cappuccino','cup',180),
('cold-coffee','glass',250),('lassi-sweet','glass',250),('lassi-salted','glass',250),
('mango-shake','glass',250),('banana-shake','glass',250),('orange-juice','glass',200),
('coconut-water','glass',200),('nimbu-pani','glass',200),('soft-drink','glass',200),
-- nuts
('almonds','piece',1.2),('walnuts','piece',5),('cashews','piece',1.5),
('peanuts','piece',0.5),('dates','piece',8)
on conflict (food_id, unit) do update set grams_equivalent = excluded.grams_equivalent;
