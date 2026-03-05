# 🎯 DODATNI PODATKI - ANALIZA IN PREDLOG

## ✅ KAJ ŽE IMAMO (Backend + API):

### 🏨 **Amenity (Ugodnosti)**
```sql
model Amenity {
  id         String   @id @default(cuid())
  propertyId String
  property   Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  name       String    // WiFi, Parkirišče, Bazen, ...
  category   String?   // connectivity, parking, facilities
  createdAt  DateTime @default(now())
}
```

**✅ API Endpoint:** `/api/tourism/properties/[id]/amenities`
- ✅ GET - seznam ugodnosti
- ✅ POST - dodaj ugodnost
- ✅ DELETE - odstrani ugodnost
- ✅ KG sync integracija

### 📋 **PropertyPolicy (Pravila)**
```sql
model PropertyPolicy {
  id         String   @id @default(cuid())
  propertyId String
  property   Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  policyType String   // cancellation, check-in, pets, ...
  content    String   @db.Text
  createdAt  DateTime @default(now())
}
```

**✅ API Endpoint:** `/api/tourism/properties/[id]/policies`
- ✅ GET - seznam pravil
- ✅ POST - dodaj pravilo
- ✅ DELETE - odstrani pravilo
- ✅ KG sync integracija

### 📅 **BlockedDate (Blokirani datumi)**
```sql
model BlockedDate {
  id         String   @id @default(cuid())
  propertyId String
  property   Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  roomId     String?
  room       Room?    @relation(fields: [roomId], references: [id], onDelete: SetNull)
  date       DateTime
  reason     String?
  createdAt  DateTime @default(now())
}
```

**✅ API Integration:** Vgrajeno v `/api/tourism/calendar/route.ts`
- ✅ GET - preveri blokirane datume
- ✅ POST - dodaj blokiran datum
- ✅ DELETE - odstrani blokiran datum
- ✅ Podpora za room-level in property-level blokiranje

---

## ❌ KAJ MANJKA (Frontend UI):

### 🏨 **Amenities Management UI**
- ❌ Ni UI za dodajanje/urejanje ugodnosti
- ❌ Ni kategorizacije (connectivity, parking, facilities)
- ❌ Ni preddefiniranih opcij (WiFi, Parkirišče, Bazen, Spa, Restavracija)

### 📋 **Policies Management UI**
- ❌ Ni UI za nastavljanje pravil
- ❌ Ni template-ov za pogosta pravila
- ❌ Ni validacije za pravilne formate

### 📅 **Blocked Dates Management UI**
- ❌ Ni UI za ročno blokiranje datumov
- ❌ Ni razlogov za blokiranje (maintenance, owner use)
- ❌ Ni bulk operacij

---

## 🚀 PREDLOG IMPLEMENTACIJE:

### Phase 1: UI Components (1 teden)

#### 1. **Amenities Management**
```typescript
// /dashboard/properties/[id]/amenities/page.tsx
export default function AmenitiesPage() {
  return (
    <div>
      <h2>Ugodnosti</h2>
      
      {/* Preddefinirane kategorije */}
      <div className="space-y-4">
        <div>
          <h3>Connectivity</h3>
          <AmenityCategory 
            category="connectivity"
            options={["WiFi", "Ethernet", "Phone"]}
          />
        </div>
        
        <div>
          <h3>Parking</h3>
          <AmenityCategory 
            category="parking"
            options={["Free Parking", "Garage", "Street Parking"]}
          />
        </div>
        
        <div>
          <h3>Facilities</h3>
          <AmenityCategory 
            category="facilities"
            options={["Bazen", "Spa", "Restavracija", "Fitnes", "Sona"]}
          />
        </div>
      </div>
      
      {/* Custom amenities */}
      <AddCustomAmenity />
    </div>
  );
}
```

#### 2. **Policies Management**
```typescript
// /dashboard/properties/[id]/policies/page.tsx
export default function PoliciesPage() {
  return (
    <div>
      <h2>Pravila Nastanitve</h2>
      
      <div className="space-y-6">
        {/* Check-in/Check-out */}
        <PolicySection
          type="check-in-out"
          title="Check-in/Check-out Times"
          template="Check-in: 15:00, Check-out: 11:00"
        />
        
        {/* Cancellation Policy */}
        <PolicySection
          type="cancellation"
          title="Cancellation Policy"
          template="Free cancellation up to 24 hours before check-in"
        />
        
        {/* Pet Policy */}
        <PolicySection
          type="pets"
          title="Pet Policy"
          template="Pets allowed with additional fee of €20 per night"
        />
        
        {/* Smoking Policy */}
        <PolicySection
          type="smoking"
          title="Smoking Policy"
          template="Non-smoking property"
        />
      </div>
    </div>
  );
}
```

#### 3. **Blocked Dates Management**
```typescript
// /dashboard/properties/[id]/blocked-dates/page.tsx
export default function BlockedDatesPage() {
  return (
    <div>
      <h2>Blokirani Datumi</h2>
      
      {/* Quick Actions */}
      <div className="flex gap-4 mb-6">
        <button onClick={() => setShowMaintenance(true)}>
          + Maintenance Block
        </button>
        <button onClick={() => setShowOwnerUse(true)}>
          + Owner Use
        </button>
        <button onClick={() => setShowCustom(true)}>
          + Custom Block
        </button>
      </div>
      
      {/* Calendar View */}
      <BlockedDatesCalendar />
      
      {/* List View */}
      <BlockedDatesList />
    </div>
  );
}
```

### Phase 2: Enhanced Property Form (3 dni)

#### **Integracija v Property Creation Form**
```typescript
// Dodaj v /dashboard/properties/create/page.tsx
<div className="bg-white rounded-lg shadow p-6">
  <h2 className="text-xl font-semibold mb-6">Ugodnosti</h2>
  
  <AmenitiesSelector 
    selected={form.amenities}
    onChange={(amenities) => handleInputChange("amenities", amenities)}
  />
</div>

<div className="bg-white rounded-lg shadow p-6">
  <h2 className="text-xl font-semibold mb-6">Pravila</h2>
  
  <PoliciesSelector 
    policies={form.policies}
    onChange={(policies) => handleInputChange("policies", policies)}
  />
</div>
```

### Phase 3: Advanced Features (2 dni)

#### **1. Smart Templates**
```typescript
// Templates za pogoste pravila
const POLICY_TEMPLATES = {
  "hotel-standard": {
    "check-in-out": "Check-in: 15:00, Check-out: 11:00",
    "cancellation": "Free cancellation up to 48 hours before check-in",
    "pets": "Pets not allowed",
    "smoking": "Non-smoking property"
  },
  "apartment-flexible": {
    "check-in-out": "Check-in: 14:00, Check-out: 10:00",
    "cancellation": "Free cancellation up to 24 hours before check-in",
    "pets": "Pets allowed with €20 fee",
    "smoking": "Designated smoking areas"
  }
};
```

#### **2. Bulk Operations**
```typescript
// Bulk dodajanje amenities
const bulkAddAmenities = async (propertyId, amenities) => {
  const promises = amenities.map(amenity => 
    fetch(`/api/tourism/properties/${propertyId}/amenities`, {
      method: "POST",
      body: JSON.stringify(amenity)
    })
  );
  await Promise.all(promises);
};

// Bulk blokiranje datumov
const bulkBlockDates = async (propertyId, dates, reason) => {
  const promises = dates.map(date => 
    fetch(`/api/tourism/calendar`, {
      method: "POST",
      body: JSON.stringify({
        propertyId,
        type: "blocked",
        checkIn: date,
        checkOut: addDays(date, 1),
        notes: reason
      })
    })
  );
  await Promise.all(promises);
};
```

---

## 🎯 KONKRETNI NAPOTKI:

### **1. Immediate (Next Session):**
```typescript
// Naredi UI komponente
/dashboard/properties/[id]/amenities/page.tsx
/dashboard/properties/[id]/policies/page.tsx
/dashboard/properties/[id]/blocked-dates/page.tsx

// Dodaj v Property Details tabs
<Link href={`/dashboard/properties/${property.id}/amenities`}>
  <button>Amenities</button>
</Link>
<Link href={`/dashboard/properties/${property.id}/policies`}>
  <button>Policies</button>
</Link>
<Link href={`/dashboard/properties/${property.id}/blocked-dates`}>
  <button>Blocked Dates</button>
</Link>
```

### **2. Integration:**
```typescript
// Dodaj v Property Details page
const tabs = [
  "overview", "rooms", "pricing", "amenities", "policies", "blocked-dates", "integrations"
];
```

### **3. API Enhancements:**
```typescript
// Dodaj DELETE endpoints za amenities in policies
// DELETE /api/tourism/properties/[id]/amenities/[amenityId]
// DELETE /api/tourism/properties/[id]/policies/[policyId]
```

---

## 💡 KLJUČNI PREDNOSTI:

### ✅ **Backend je 100% POPOLN:**
- Vsi modeli obstajajo
- Vsi API endpointi delujejo
- KG sync integracija
- Optimizacije in indeksi

### 🎯 **Frontend Implementation:**
- Modern React UI komponente
- Template-ji za hitro nastavljanje
- Bulk operacije
- Real-time updates

### 🚀 **User Experience:**
- Drag & drop za amenities
- Calendar view za blocked dates
- Template picker za policies
- Quick actions za pogoste operacije

---

## 📋 IMPLEMENTACIJSKI PLAN:

### **Week 1:**
1. ✅ Amenities Management UI
2. ✅ Policies Management UI  
3. ✅ Blocked Dates Management UI

### **Week 2:**
1. ✅ Integration v Property Details
2. ✅ Template system
3. ✅ Bulk operations

### **Week 3:**
1. ✅ Advanced features
2. ✅ Testing in optimization
3. ✅ Documentation

**Total: 3 tedni za polno implementacijo**

---

## 🎯 ZAKLJUČEK:

**✅ Backend je 100% pripravljen!**
- Vsi modeli obstajajo
- Vsi API endpointi delujejo
- Podpira vse funkcionalnosti

**🎯 Frontend potrebuje implementacijo:**
- UI komponente za management
- Integracija v obstožeče strani
- Template system za hitro delo

**💡 Prioriteta:**
1. **Amenities Management** - najbolj pomembno za goste
2. **Policies Management** - pravilna komunikacija
3. **Blocked Dates** - operational management

**🚀 Direktor bo imel polno kontrola nad vsemi dodatnimi podatki!**
