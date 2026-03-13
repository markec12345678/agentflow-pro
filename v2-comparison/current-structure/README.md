/**
 * Current Structure (2024) - Properties Feature
 * 
 * This demonstrates the OLD approach for comparison.
 * Mixed concerns, less type safety, harder to test.
 */

// ============================================================================
// FILE: src/app/(dashboard)/properties/page.tsx (OLD APPROACH)
// ============================================================================

/*
export default async function PropertiesPage() {
  // ❌ Data fetching mixed with UI
  const session = await getSession();
  if (!session) redirect('/auth');
  
  const properties = await db.property.findMany({
    where: { userId: session.user.id }
  });
  
  return (
    <div>
      <h1>Moje nepremičnine</h1>
      {properties.map(p => (
        <PropertyCard key={p.id} property={p} />
      ))}
    </div>
  );
}
*/

// ============================================================================
// FILE: src/components/features/PropertyCard.tsx (OLD APPROACH)
// ============================================================================

/*
interface PropertyCardProps {
  property: any; // ❌ No type safety
}

function PropertyCard({ property }: PropertyCardProps) {
  // ❌ Business logic in component
  const handleDelete = async () => {
    const res = await fetch('/api/properties/delete', {
      method: 'DELETE',
      body: JSON.stringify({ id: property.id })
    });
    
    if (!res.ok) {
      alert('Napaka pri brisanju'); // ❌ Poor error handling
      return;
    }
    
    router.refresh(); // ❌ Manual refresh
  };
  
  return (
    <div>
      <img src={property.images[0]} />
      <h3>{property.name}</h3>
      <p>€{property.pricePerNight}</p>
      <button onClick={handleDelete}>Izbriši</button>
    </div>
  );
}
*/

// ============================================================================
// FILE: src/app/api/properties/route.ts (OLD APPROACH)
// ============================================================================

/*
export async function GET() {
  // ❌ No validation
  const properties = await db.property.findMany();
  return Response.json(properties);
}

export async function POST(request: Request) {
  // ❌ Manual validation
  const body = await request.json();
  
  if (!body.name || body.name.length < 3) {
    return Response.json({ error: 'Name required' }, { status: 400 });
  }
  
  // ❌ Mixed concerns
  const property = await db.property.create({
    data: body
  });
  
  return Response.json(property);
}
*/

// ============================================================================
// KEY PROBLEMS WITH OLD APPROACH:
// ============================================================================

/*
1. ❌ No separation of concerns
   - Data fetching in components
   - Business logic in UI
   - Validation scattered everywhere

2. ❌ Poor type safety
   - `any` types everywhere
   - No validation schemas
   - Runtime errors possible

3. ❌ Hard to test
   - Components do too much
   - No isolation
   - Need DB for unit tests

4. ❌ Not reusable
   - Logic duplicated across pages
   - Can't share between client/server
   - Copy-paste code

5. ❌ Poor error handling
   - Alert boxes
   - No error boundaries
   - Inconsistent responses

6. ❌ Hard to maintain
   - Unclear where to put new code
   - Spaghetti dependencies
   - Fear of refactoring
*/

// ============================================================================
// NEW APPROACH BENEFITS:
// ============================================================================

/*
1. ✅ Clear separation
   - Entities: types + schemas
   - Features: business logic
   - Components: UI only
   - Infrastructure: DB, external APIs

2. ✅ Full type safety
   - Zod schemas
   - Generated types
   - End-to-end types

3. ✅ Easy to test
   - Isolated hooks
   - Mockable services
   - Pure components

4. ✅ Highly reusable
   - Shared hooks
   - Composable components
   - Single source of truth

5. ✅ Great error handling
   - Error boundaries
   - Toast notifications
   - Consistent API errors

6. ✅ Easy to maintain
   - Clear patterns
   - Obvious where to add code
   - Safe to refactor
*/

export {};
