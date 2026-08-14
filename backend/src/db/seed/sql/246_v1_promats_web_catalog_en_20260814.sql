-- Complete the public Promats English catalog from the approved Turkish web catalog.
-- Scope: web_promats_* only. ERP/product-stock tables are intentionally untouched.
SET NAMES utf8mb4;
START TRANSACTION;

DROP TEMPORARY TABLE IF EXISTS _promats_en_catalog;
CREATE TEMPORARY TABLE _promats_en_catalog (
  tr_slug varchar(255) NOT NULL PRIMARY KEY,
  en_slug varchar(255) NOT NULL,
  sort_order int NOT NULL,
  en_name varchar(255) NOT NULL,
  display_name varchar(255) NOT NULL,
  title1 varchar(255) NOT NULL,
  design varchar(255) NOT NULL,
  footrest varchar(32) NOT NULL,
  options varchar(255) NOT NULL,
  concept_title varchar(255) NOT NULL,
  concept_description text NOT NULL,
  advantage_title varchar(255) NOT NULL,
  advantage_text text NOT NULL,
  hero_extra text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO _promats_en_catalog VALUES
('orbital-krom-serisi','orbital-chrome-series',9,'ORBITAL CHROME SERIES','Orbital Chrome','ORBITAL CHROME','3D deep-tray universal design','Available','Carbon, Red, Blue and Silver decorative film options','3D CONCEPT','The 3D form and raised edges help retain everyday dirt and liquids on the mat, supporting protection of the vehicle floor.','3D Protection with Decorative Details','The raised 3D form combines practical floor protection with four decorative PVC film alternatives.','A decorative PVC film is offered in Carbon, Red, Blue and Silver. The integrated left footrest extends protection on the driver side.'),
('kapitone-serisi','quilted-series',10,'QUILTED SERIES','Quilted','QUILTED','flat universal design','Not included','Standard PVC color options','UNIVERSAL FIT AND FUNCTIONAL DESIGN','The flexible universal structure helps protect the vehicle floor against dirt, dust and moisture in everyday use and can be adapted to different floor shapes.','Distinctive Quilted Surface','The quilted surface pattern gives the vehicle interior a refined appearance while supporting practical everyday protection.','Its distinctive quilted surface adds a refined visual character to the vehicle interior.'),
('premium-serisi','premium-series',11,'PREMIUM SERIES','Premium','PREMIUM','universal design with functional edges','Not included','Standard PVC color options','FUNCTIONAL EDGE DESIGN','The balanced edge and surface form helps control everyday dirt while prioritizing comfortable use and a clean interior appearance.','Balanced Premium Design','The Premium Series focuses on a balanced surface, functional edges and comfortable everyday use.','Its balanced surface and functional edge design combine everyday protection with comfortable use.'),
('extra-havuzlu-serisi','extra-deep-tray-series',12,'EXTRA DEEP TRAY SERIES','Extra Deep Tray','EXTRA DEEP TRAY','deep-tray universal design','Not included','Standard PVC color options','UNIVERSAL FIT AND FUNCTIONAL DESIGN','The flexible deep-tray structure helps retain everyday dirt and moisture on the mat and can be adapted to different vehicle floors.','Deep-Tray Protection','Raised edges help retain water, mud and everyday dirt on the mat to support protection of the vehicle floor.','Its raised deep-tray form helps retain water, mud and everyday dirt on the mat.'),
('extra-plus-serisi','extra-plus-series',13,'EXTRA PLUS SERIES','Extra Plus','EXTRA PLUS','deep-tray universal design','Available','Standard PVC color options','UNIVERSAL FIT AND FUNCTIONAL DESIGN','The flexible universal structure helps retain everyday dirt and moisture and can be adapted to different vehicle floors.','Deep-Tray Design with Footrest','The Extra Plus combines deep-tray protection with an integrated left footrest that extends coverage on the driver side.','The integrated left footrest extends protection on the driver side.'),
('extra-havuzlu-krom-serisi','extra-deep-tray-chrome-series',14,'EXTRA DEEP TRAY CHROME SERIES','Extra Deep Tray Chrome','EXTRA DEEP TRAY CHROME','deep-tray universal design','Not included','Carbon, Red, Blue and Silver decorative film options','UNIVERSAL FIT AND FUNCTIONAL DESIGN','The flexible deep-tray structure helps retain everyday dirt and moisture and can be adapted to different vehicle floors.','Deep-Tray Protection with Chrome Details','Raised edges support everyday floor protection, while four decorative PVC film alternatives add a distinctive appearance.','A decorative PVC film is offered in Carbon, Red, Blue and Silver.'),
('extra-plus-krom-serisi','extra-plus-chrome-series',15,'EXTRA PLUS CHROME SERIES','Extra Plus Chrome','EXTRA PLUS CHROME','deep-tray universal design','Available','Carbon, Red, Blue and Silver decorative film options','UNIVERSAL FIT AND FUNCTIONAL DESIGN','The flexible universal structure helps retain everyday dirt and moisture and can be adapted to different vehicle floors.','Chrome Details with Driver-Side Footrest','The integrated left footrest extends driver-side protection, while four decorative PVC film alternatives add a distinctive appearance.','The integrated left footrest extends protection on the driver side. A decorative PVC film is offered in Carbon, Red, Blue and Silver.'),
('star-serisi','star-series',16,'STAR SERIES','Star','STAR','flat universal design','Not included','Standard PVC color options','UNIVERSAL FIT AND FUNCTIONAL DESIGN','The flexible universal structure helps protect the vehicle floor against dirt, dust and moisture and can be adapted to different vehicle floors.','Practical Everyday Surface','The functional surface pattern and flexible structure provide practical protection for everyday driving.','Its functional surface design provides a practical solution for everyday use.'),
('gliptone-serisi','gliptone-series',17,'GLIPTONE SERIES','Gliptone','GLIPTONE','flat universal design','Not included','Standard PVC color options','UNIVERSAL FIT AND FUNCTIONAL DESIGN','The flexible universal structure helps protect the vehicle floor against dirt, dust and moisture and can be adapted to different vehicle floors.','Flexible Universal Protection','The Gliptone Series combines a flexible PVC structure with a functional surface designed for everyday use.','Its flexible universal construction supports easy fitting and everyday protection.'),
('badem-serisi','almond-series',18,'ALMOND SERIES','Almond','ALMOND','flat universal design','Not included','Black','UNIVERSAL FIT AND FUNCTIONAL DESIGN','The flexible universal structure helps protect the vehicle floor against dirt, dust and moisture and can be adapted to different vehicle floors.','Simple and Functional Design','The Almond Series offers a clean black finish and a functional surface for practical everyday protection.','It is offered in black with a simple, functional surface design.'),
('yeni-nesil-serisi','new-generation-series',19,'NEW GENERATION SERIES','New Generation','NEW GENERATION','flat universal design','Not included','Standard PVC color options','UNIVERSAL FIT AND FUNCTIONAL DESIGN','The flexible universal structure helps protect the vehicle floor against dirt, dust and moisture and can be adapted to different vehicle floors.','Contemporary Universal Design','The New Generation Series combines a contemporary surface pattern with a flexible trim-to-fit structure.','Its contemporary surface pattern and trim-to-fit construction support practical everyday use.'),
('yeni-nesil-krom-serisi','new-generation-chrome-series',20,'NEW GENERATION CHROME SERIES','New Generation Chrome','NEW GENERATION CHROME','flat universal design','Not included','Carbon, Red, Blue and Silver decorative film options','UNIVERSAL FIT AND FUNCTIONAL DESIGN','The flexible universal structure helps protect the vehicle floor against dirt, dust and moisture and can be adapted to different vehicle floors.','Contemporary Design with Chrome Details','The contemporary universal surface is complemented by four decorative PVC film alternatives.','A decorative PVC film is offered in Carbon, Red, Blue and Silver.');

-- Keep the eight existing English products in the same order as Turkish.
UPDATE web_promats_products
SET sort_order = CASE slug
  WHEN 'orbital-series-4521350' THEN 1
  WHEN 'maximum-series' THEN 2
  WHEN 'star-plus-series' THEN 3
  WHEN 'icon-series' THEN 4
  WHEN 'pars-series-4156973' THEN 5
  WHEN 'basak-plus-series-1199545' THEN 6
  WHEN 'professional-series' THEN 7
  WHEN 'tuna-series' THEN 8
  ELSE sort_order
END,
source_language_id=1
WHERE language_id=2;

-- Create only missing English rows and retain the approved Turkish images/dimensions.
SET @next_product_id = (SELECT COALESCE(MAX(id),0) FROM web_promats_products);
INSERT INTO web_promats_products (
  id,language_id,source_language_id,sort_order,name,
  s1_1_text,s1_2_text,s1_3_text,s1_4_image,
  s2_1_image,s2_2_text,s2_3_text,s2_4_text,s2_5_text,
  s3_1_image,s3_2_image,s4_1_image,
  s5_1_text,s5_2_text,s5_3_text,s5_4_text,s5_5_text,
  slug,seo_title,seo_description,
  detail_description,detail_technical,detail_usage,detail_advantages,
  detail_material,detail_universal,detail_source_url,status,created_at
)
SELECT
  (@next_product_id:=@next_product_id+1),2,1,c.sort_order,c.en_name,
  c.title1,'SERIES',NULL,tr.s1_4_image,
  tr.s2_1_image,NULL,NULL,NULL,NULL,
  tr.s3_1_image,tr.s3_2_image,tr.s4_1_image,
  tr.s5_1_text,tr.s5_2_text,tr.s5_3_text,tr.s5_4_text,tr.s5_5_text,
  c.en_slug,NULL,NULL,
  NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NOW()
FROM _promats_en_catalog c
JOIN web_promats_products tr ON tr.language_id=1 AND tr.slug=c.tr_slug
LEFT JOIN web_promats_products en ON en.language_id=2 AND en.slug=c.en_slug
WHERE en.id IS NULL
ORDER BY c.sort_order;

-- Publish complete English copy for every newly localized series.
UPDATE web_promats_products en
JOIN _promats_en_catalog c ON c.en_slug=en.slug
SET
  en.language_id=2,
  en.source_language_id=1,
  en.sort_order=c.sort_order,
  en.name=c.en_name,
  en.s1_1_text=c.title1,
  en.s1_2_text='SERIES',
  en.s1_3_text=CONCAT(
    'Promats ',c.display_name,' Series is a universal PVC car floor mat range developed with durable PVC compound and a functional surface design. ',
    c.hero_extra,
    ' Its washable, trim-to-fit construction provides a practical solution for everyday use.'
  ),
  en.s2_2_text=NULL,
  en.s2_3_text=c.concept_title,
  en.s2_4_text=NULL,
  en.s2_5_text=c.concept_description,
  en.seo_title=CONCAT(c.en_name,' | Promats'),
  en.seo_description=CONCAT(
    'Discover Promats ',c.display_name,' Series universal PVC car floor mats with durable material, practical protection and an easy-to-clean trim-to-fit design.'
  ),
  en.detail_description=CONCAT(
    '<p>Promats ',c.display_name,' Series combines a ',c.design,' with a five-piece set and durable PVC compound. ',
    'It helps protect the vehicle floor against dirt, dust, moisture and everyday contaminants. ',
    IF(c.footrest='Available','The integrated left footrest extends coverage on the driver side. ',''),
    'Its trim-to-fit universal construction can be adapted to different vehicle floors, while the washable surface simplifies regular care and cleaning.</p>'
  ),
  en.detail_technical=CONCAT(
    '<p><strong>Product Type:</strong> Universal PVC car floor mat</p>',
    '<p><strong>Series:</strong> ',c.display_name,'</p>',
    '<p><strong>Design:</strong> ',c.design,'</p>',
    '<p><strong>Set Contents:</strong> 5 pieces</p>',
    '<p><strong>Left Footrest:</strong> ',c.footrest,'</p>',
    '<p><strong>Material:</strong> PVC compound</p>',
    '<p><strong>Color / Decorative Options:</strong> ',c.options,'</p>',
    '<p><strong>Cleaning:</strong> Washable</p>',
    '<p><strong>Compatibility:</strong> Adaptable to different vehicles through designated trim lines</p>',
    '<h3>5-Piece Complete Set</h3>',
    '<p>Two front mats, two rear mats and one center tunnel piece help provide broad coverage across the front, rear and center floor areas.</p>'
  ),
  en.detail_usage='<h3>Cleaning and Care</h3><p>Remove the mats from the vehicle and wash them with water and a suitable cleaning product. Surface dirt can be cleaned with a soft brush or cloth. Allow the mats to dry completely before placing them back in the vehicle.</p>',
  en.detail_advantages=CONCAT(
    '<h3>',c.advantage_title,'</h3><p>',c.advantage_text,'</p>',
    '<ul><li>Five-piece complete set</li><li>Flexible and durable PVC compound</li><li>Trim-to-fit universal design</li><li>Washable, easy-to-clean surface</li><li>',c.options,'</li>',
    IF(c.footrest='Available','<li>Integrated left footrest</li>',''),'</ul>',
    '<h3>Premium PVC Material</h3><p>High-quality PVC compound provides a flexible and durable structure suitable for long-term everyday use.</p>',
    '<h3>Trim-to-Fit Universal Design</h3><p>Designated trim lines make it easier to adapt the mats to different vehicle floor layouts.</p>',
    '<h3>Frequently Asked Questions</h3>',
    '<p><strong>Which vehicles does the ',c.display_name,' Series fit?</strong></p><p>Its universal structure is suitable for many passenger cars and other vehicles with compatible floor dimensions.</p>',
    '<p><strong>Can the mats be trimmed?</strong></p><p>Yes. The designated trim lines help adapt the mats to the vehicle floor when required.</p>',
    '<p><strong>How many pieces are included?</strong></p><p>The set contains two front mats, two rear mats and one center tunnel piece.</p>',
    '<p><strong>How should the mats be cleaned?</strong></p><p>Remove them from the vehicle and clean them with water and a suitable cleaning product.</p>'
  ),
  en.detail_material=CONCAT(
    '<p>',c.display_name,' Series is manufactured using Promats PVC compound technology. The material is designed for flexibility, shape retention, everyday durability and low odor, while providing practical resistance to water and regular dirt.</p>'
  ),
  en.detail_universal=CONCAT(
    '<p>',c.display_name,' Series is developed for use in different vehicle makes and models. Designated trim lines allow the mats to be adapted when necessary. Place the mats on the vehicle floor and check the fit before trimming.</p>'
  ),
  en.detail_source_url=NULL,
  en.status=1;

-- Rebuild translated feature rows while preserving all approved images.
DELETE f
FROM web_promats_product_features f
JOIN web_promats_products en ON en.id=f.product_id
JOIN _promats_en_catalog c ON c.en_slug=en.slug;

SET @next_feature_id = (SELECT COALESCE(MAX(id),0) FROM web_promats_product_features);
INSERT INTO web_promats_product_features
  (id,product_id,type,sort_order,image,feature,status,created_at)
SELECT
  (@next_feature_id:=@next_feature_id+1),en.id,f.type,f.sort_order,f.image,
  CASE
    WHEN f.feature='Karbon' THEN 'Carbon'
    WHEN f.feature='Kırmızı' THEN 'Red'
    WHEN f.feature='Mavi' THEN 'Blue'
    WHEN f.feature='Silver' THEN 'Silver'
    WHEN f.feature='Siyah' THEN 'Black'
    WHEN f.feature='Standart PVC renk seçenekleri' THEN 'Standard PVC color options'
    WHEN f.feature='Premium PVC Malzeme' THEN 'Premium PVC Material'
    WHEN f.feature='Kesilebilir Universal Tasarım' THEN 'Trim-to-Fit Universal Design'
    WHEN f.feature='Kolay Temizlenebilir' THEN 'Easy to Clean'
    WHEN f.feature LIKE 'İki ön,%' AND c.footrest='Available' THEN 'The five-piece set includes two front mats, two rear mats and one center tunnel piece. The integrated left footrest completes driver-side coverage.'
    WHEN f.feature LIKE 'İki ön,%' THEN 'The five-piece set includes two front mats, two rear mats and one center tunnel piece for broad floor coverage.'
    ELSE f.feature
  END,
  f.status,NOW()
FROM _promats_en_catalog c
JOIN web_promats_products tr ON tr.language_id=1 AND tr.slug=c.tr_slug
JOIN web_promats_products en ON en.language_id=2 AND en.slug=c.en_slug
JOIN web_promats_product_features f ON f.product_id=tr.id
ORDER BY c.sort_order,f.type,f.sort_order,f.id;

DROP TEMPORARY TABLE _promats_en_catalog;
COMMIT;
