-- Check existing User roles
SELECT DISTINCT "role" FROM "User" LIMIT 20;

-- Check if properties table has country, parkingFee, etc.
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name IN ('country', 'parkingFee', 'petsAllowed', 'reviewCount', 'smokingAllowed', 'status');
