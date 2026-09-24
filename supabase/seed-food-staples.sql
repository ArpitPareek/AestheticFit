-- seed-food-staples.sql
-- Raw cooking ingredients + staples, named the way the parser's ingredient
-- decomposition emits them ("toor dal", "cooking oil", "atta", "onion"). IFCT
-- has most of these under formal botanical names; these cleanly-named rows with
-- rich aliases make per-ingredient lookups resolve reliably, which is what makes
-- composed-dish macros accurate.
--
-- Macros per 100 g (serving_grams = 100), standard reference values.
-- id = kebab-slug. source = 'manual'. Idempotent. Run whole in the SQL editor.

insert into food_library
  (id, name, aliases, category, is_vegetarian, serving_size, serving_grams,
   calories, protein_g, carbs_g, fat_g, fiber_g, source)
values
-- Dals & pulses (dry) --------------------------------------------------------
('toor-dal', 'Toor dal (dry)', ARRAY['arhar dal','toor dal','tur dal','red gram dal','pigeon pea']::text[], 'Grain Legumes', true, '100 g dry', 100, 343, 22, 63, 1.5, 15, 'manual'),
('moong-dal-raw', 'Moong dal (dry)', ARRAY['moong dal','mung dal','green gram dal','yellow moong']::text[], 'Grain Legumes', true, '100 g dry', 100, 348, 24, 59, 1.2, 16, 'manual'),
('chana-dal-raw', 'Chana dal (dry)', ARRAY['chana dal','bengal gram dal','split chickpea']::text[], 'Grain Legumes', true, '100 g dry', 100, 364, 22, 60, 6, 12, 'manual'),
('urad-dal-raw', 'Urad dal (dry)', ARRAY['urad dal','black gram dal','split black gram']::text[], 'Grain Legumes', true, '100 g dry', 100, 341, 25, 59, 1.6, 18, 'manual'),
('masoor-dal-raw', 'Masoor dal (dry)', ARRAY['masoor dal','red lentil','pink lentil']::text[], 'Grain Legumes', true, '100 g dry', 100, 352, 25, 60, 1.3, 11, 'manual'),
('rajma-raw', 'Rajma (dry)', ARRAY['rajma','kidney beans dry','red kidney beans']::text[], 'Grain Legumes', true, '100 g dry', 100, 333, 24, 60, 1, 15, 'manual'),
('kabuli-chana-raw', 'Kabuli chana (dry)', ARRAY['chickpea dry','kabuli chana','chhole dry','garbanzo']::text[], 'Grain Legumes', true, '100 g dry', 100, 364, 19, 61, 6, 17, 'manual'),
('kala-chana-raw', 'Kala chana (dry)', ARRAY['black chickpea','kala chana','brown chana']::text[], 'Grain Legumes', true, '100 g dry', 100, 360, 20, 61, 5, 18, 'manual'),
-- Grains & flours ------------------------------------------------------------
('rice-raw', 'Rice (raw)', ARRAY['raw rice','white rice raw','chawal','uncooked rice']::text[], 'Cereals and Millets', true, '100 g raw', 100, 345, 6.8, 78, 0.5, 1.3, 'manual'),
('basmati-rice-raw', 'Basmati rice (raw)', ARRAY['basmati','basmati rice']::text[], 'Cereals and Millets', true, '100 g raw', 100, 350, 7.5, 77, 0.6, 1.3, 'manual'),
('wheat-flour-atta', 'Wheat flour (atta)', ARRAY['atta','wheat flour','whole wheat flour','gehun atta']::text[], 'Cereals and Millets', true, '100 g', 100, 340, 12, 72, 1.7, 11, 'manual'),
('maida', 'Maida (refined flour)', ARRAY['maida','refined flour','all purpose flour','plain flour']::text[], 'Cereals and Millets', true, '100 g', 100, 348, 10, 74, 1, 2.7, 'manual'),
('besan-flour', 'Besan (gram flour)', ARRAY['besan','gram flour','chickpea flour']::text[], 'Cereals and Millets', true, '100 g', 100, 387, 22, 58, 6.7, 11, 'manual'),
('rava-sooji', 'Rava (sooji)', ARRAY['rava','sooji','suji','semolina']::text[], 'Cereals and Millets', true, '100 g', 100, 360, 12, 73, 1, 3.9, 'manual'),
('poha-raw', 'Poha (raw)', ARRAY['poha raw','flattened rice','beaten rice','chidwa']::text[], 'Cereals and Millets', true, '100 g', 100, 346, 6.6, 77, 1.2, 2.5, 'manual'),
('vermicelli', 'Vermicelli (raw)', ARRAY['seviyan','vermicelli','semiya']::text[], 'Cereals and Millets', true, '100 g', 100, 350, 11, 72, 1, 3, 'manual'),
('cornflour', 'Cornflour', ARRAY['corn flour','corn starch','cornstarch']::text[], 'Cereals and Millets', true, '100 g', 100, 381, 0.3, 91, 0.1, 0.9, 'manual'),
-- Oils & fats ----------------------------------------------------------------
('cooking-oil', 'Cooking oil', ARRAY['oil','cooking oil','refined oil','vegetable oil','sunflower oil','rice bran oil','soybean oil']::text[], 'Edible Oils and Fats', true, '100 ml', 100, 884, 0, 0, 100, 0, 'manual'),
('mustard-oil', 'Mustard oil', ARRAY['mustard oil','sarson oil','kachi ghani']::text[], 'Edible Oils and Fats', true, '100 ml', 100, 884, 0, 0, 100, 0, 'manual'),
('coconut-oil', 'Coconut oil', ARRAY['coconut oil','nariyal tel']::text[], 'Edible Oils and Fats', true, '100 ml', 100, 862, 0, 0, 100, 0, 'manual'),
('olive-oil', 'Olive oil', ARRAY['olive oil']::text[], 'Edible Oils and Fats', true, '100 ml', 100, 884, 0, 0, 100, 0, 'manual'),
-- Sweeteners -----------------------------------------------------------------
('sugar', 'Sugar', ARRAY['sugar','cheeni','chini','shakkar','white sugar']::text[], 'Sugars', true, '100 g', 100, 387, 0, 100, 0, 0, 'manual'),
('jaggery', 'Jaggery', ARRAY['jaggery','gur','gud']::text[], 'Sugars', true, '100 g', 100, 383, 0.4, 98, 0.1, 0, 'manual'),
-- Vegetables (raw) -----------------------------------------------------------
('onion', 'Onion', ARRAY['onion','pyaz','pyaaz','kanda']::text[], 'Other Vegetables', true, '100 g', 100, 40, 1.1, 9, 0.1, 1.7, 'manual'),
('tomato', 'Tomato', ARRAY['tomato','tamatar']::text[], 'Other Vegetables', true, '100 g', 100, 18, 0.9, 3.9, 0.2, 1.2, 'manual'),
('potato', 'Potato', ARRAY['potato','aloo','alu','batata']::text[], 'Roots and Tubers', true, '100 g', 100, 77, 2, 17, 0.1, 2.2, 'manual'),
('garlic', 'Garlic', ARRAY['garlic','lehsun','lasan']::text[], 'Condiments and Spices', true, '100 g', 100, 149, 6.4, 33, 0.5, 2.1, 'manual'),
('ginger', 'Ginger', ARRAY['ginger','adrak']::text[], 'Condiments and Spices', true, '100 g', 100, 80, 1.8, 18, 0.8, 2, 'manual'),
('green-chilli', 'Green chilli', ARRAY['green chilli','hari mirch','chilli']::text[], 'Condiments and Spices', true, '100 g', 100, 40, 1.9, 9, 0.4, 1.5, 'manual'),
('coriander-leaves', 'Coriander leaves', ARRAY['coriander','dhania','cilantro','hara dhania']::text[], 'Green Leafy Vegetables', true, '100 g', 100, 23, 2.1, 3.7, 0.5, 2.8, 'manual'),
('spinach', 'Spinach', ARRAY['spinach','palak']::text[], 'Green Leafy Vegetables', true, '100 g', 100, 23, 2.9, 3.6, 0.4, 2.2, 'manual'),
('capsicum', 'Capsicum', ARRAY['capsicum','bell pepper','shimla mirch']::text[], 'Other Vegetables', true, '100 g', 100, 20, 0.9, 4.6, 0.2, 1.7, 'manual'),
('carrot', 'Carrot', ARRAY['carrot','gajar']::text[], 'Roots and Tubers', true, '100 g', 100, 41, 0.9, 10, 0.2, 2.8, 'manual'),
('green-peas', 'Green peas', ARRAY['peas','matar','green peas']::text[], 'Other Vegetables', true, '100 g', 100, 81, 5.4, 14, 0.4, 5.7, 'manual'),
('cauliflower', 'Cauliflower', ARRAY['cauliflower','gobi','phool gobhi']::text[], 'Other Vegetables', true, '100 g', 100, 25, 1.9, 5, 0.3, 2, 'manual'),
('cabbage', 'Cabbage', ARRAY['cabbage','patta gobhi']::text[], 'Other Vegetables', true, '100 g', 100, 25, 1.3, 6, 0.1, 2.5, 'manual'),
('brinjal', 'Brinjal', ARRAY['brinjal','eggplant','baingan','aubergine']::text[], 'Other Vegetables', true, '100 g', 100, 25, 1, 6, 0.2, 3, 'manual'),
('okra', 'Okra', ARRAY['okra','bhindi','ladyfinger']::text[], 'Other Vegetables', true, '100 g', 100, 33, 1.9, 7, 0.2, 3.2, 'manual'),
('bottle-gourd', 'Bottle gourd', ARRAY['bottle gourd','lauki','ghiya','dudhi']::text[], 'Other Vegetables', true, '100 g', 100, 14, 0.6, 3.4, 0.1, 0.5, 'manual'),
('cucumber', 'Cucumber', ARRAY['cucumber','kheera','kakdi']::text[], 'Other Vegetables', true, '100 g', 100, 15, 0.7, 3.6, 0.1, 0.5, 'manual'),
-- Dairy for cooking ----------------------------------------------------------
('cream', 'Fresh cream', ARRAY['cream','malai','fresh cream','heavy cream']::text[], 'Milk and Milk Products', true, '100 g', 100, 292, 2.1, 3, 30, 0, 'manual'),
('khoya', 'Khoya', ARRAY['khoya','mawa','khoa']::text[], 'Milk and Milk Products', true, '100 g', 100, 420, 14, 25, 30, 0, 'manual'),
('condensed-milk', 'Condensed milk', ARRAY['condensed milk','milkmaid']::text[], 'Milk and Milk Products', true, '100 g', 100, 321, 8, 54, 9, 0, 'manual'),
('coconut-milk', 'Coconut milk', ARRAY['coconut milk','nariyal doodh']::text[], 'Milk and Milk Products', true, '100 ml', 100, 230, 2.3, 6, 24, 2.2, 'manual'),
('grated-coconut', 'Grated coconut', ARRAY['coconut','fresh coconut','nariyal','kopra']::text[], 'Nuts and Oil Seeds', true, '100 g', 100, 354, 3.3, 15, 33, 9, 'manual'),
-- Seeds & misc ---------------------------------------------------------------
('sesame-seeds', 'Sesame seeds', ARRAY['sesame','til','sesame seeds']::text[], 'Nuts and Oil Seeds', true, '100 g', 100, 573, 18, 23, 50, 12, 'manual'),
('tamarind', 'Tamarind', ARRAY['tamarind','imli']::text[], 'Condiments and Spices', true, '100 g', 100, 239, 2.8, 62, 0.6, 5, 'manual'),
('tomato-puree', 'Tomato puree', ARRAY['tomato puree','tomato paste']::text[], 'Condiments and Spices', true, '100 g', 100, 38, 1.6, 9, 0.2, 1.5, 'manual'),
('ginger-garlic-paste', 'Ginger-garlic paste', ARRAY['ginger garlic paste','adrak lehsun paste']::text[], 'Condiments and Spices', true, '100 g', 100, 100, 4, 20, 0.6, 2, 'manual'),
('salt', 'Salt', ARRAY['salt','namak']::text[], 'Condiments and Spices', true, '100 g', 100, 0, 0, 0, 0, 0, 'manual'),
('water', 'Water', ARRAY['water','pani']::text[], 'Miscellaneous Foods', true, '100 ml', 100, 0, 0, 0, 0, 0, 'manual')
on conflict (id) do update set
  name = excluded.name, aliases = excluded.aliases, category = excluded.category,
  is_vegetarian = excluded.is_vegetarian, serving_size = excluded.serving_size,
  serving_grams = excluded.serving_grams, calories = excluded.calories,
  protein_g = excluded.protein_g, carbs_g = excluded.carbs_g, fat_g = excluded.fat_g,
  fiber_g = excluded.fiber_g, source = excluded.source;

-- Piece conversions for whole vegetables commonly logged directly.
insert into portion_conversions (food_id, unit, grams_equivalent) values
('onion','piece',100),('tomato','piece',80),('potato','piece',100),
('carrot','piece',60),('green-chilli','piece',5),('capsicum','piece',120),
('cucumber','piece',150),('brinjal','piece',80)
on conflict (food_id, unit) do update set grams_equivalent = excluded.grams_equivalent;
