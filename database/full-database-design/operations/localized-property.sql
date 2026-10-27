-- Example only: bind $1=slug, $2=validated language code. API rejects unsupported languages.
SELECT p.id,p.slug,t.title,t.description,p.price::text AS "priceDecimal",p.currency_code AS "currencyCode",
 $2::text AS "requestedLanguage",t.language_code AS "contentLanguage",t.language_code<>$2 AS "fallbackUsed"
FROM public.property p
JOIN public.property_developer d ON d.id=p.property_developer_id AND d.seller_status='ACTIVE' AND d.deleted_at IS NULL
CROSS JOIN public.app_settings settings
JOIN LATERAL (
 SELECT tr.title,tr.description,tr.language_code FROM public.property_translation tr
 WHERE tr.property_id=p.id AND tr.is_published
 AND tr.language_code=ANY(ARRAY[$2,settings.fallback_language_code,p.source_language_code])
 ORDER BY array_position(ARRAY[$2,settings.fallback_language_code,p.source_language_code],tr.language_code)
 LIMIT 1
)t ON true
WHERE p.slug=$1 AND p.status='ACTIVE' AND p.deleted_at IS NULL AND p.currency_code IS NOT NULL AND settings.id=1;
