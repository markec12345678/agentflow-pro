# 🎨 Custom Branding & White-label Guide

## Overview

AgentFlow Pro now supports complete custom branding and white-label functionality. Customize your instance with your own logo, colors, fonts, and remove AgentFlow branding from emails and UI.

---

## 🎨 Features Implemented

### 1. Custom Branding

**What you can customize:**
- ✅ **Logo Upload** - Main logo (500x200px) and small logo for emails (200x100px)
- ✅ **Color Scheme** - Primary, secondary, and accent colors
- ✅ **Typography** - Font family selection (Inter, Roboto, Open Sans, etc.)
- ✅ **Custom CSS** - Advanced users can add custom CSS
- ✅ **Custom Domain** - Configure your own domain (requires DNS setup)
- ✅ **White-label Toggle** - Remove "Powered by AgentFlow Pro" branding

### 2. White-label Emails

**Email customization:**
- ✅ Custom logo in email header
- ✅ Brand colors in email templates
- ✅ Custom font family
- ✅ Remove AgentFlow branding from footer
- ✅ Add custom company footer

### 3. Enhanced Permission System

**New permission features:**
- ✅ **Custom Roles** - Create custom roles with specific permissions
- ✅ **Granular Permissions** - Fine-grained control over features
- ✅ **Property-level Access** - Control access per property
- ✅ **Permission Categories** - Organized by feature (reservations, reports, settings)

---

## 📁 Files Added/Modified

### Database Schema
- **File:** `prisma/schema.prisma`
- **New Models:**
  - `Branding` - User branding configuration
  - `Permission` - Granular permissions
  - `CustomRole` - Custom user roles
  - `RolePermission` - Role-permission mapping
  - `PropertyAccess` - Property-level access control

### API Routes
- **`/api/branding`** (GET/PUT) - Get/update branding configuration
- **`/api/branding/logo`** (POST) - Upload logo images
- **`/api/permissions`** (GET/POST) - Manage permissions
- **`/api/roles`** (GET/POST) - Manage custom roles
- **`/api/property-access`** (GET/PUT) - Manage property access

### UI Components
- **`src/components/settings/BrandingSettings.tsx`** - Branding configuration UI
- **`src/components/settings/PermissionManagement.tsx`** - Permission management UI

### Email Templates
- **`src/lib/email-templates/guest-templates.ts`** - Updated `renderEmailTemplate()` with branding support

### Tests
- **`tests/api/branding.test.ts`** - Branding API tests
- **`tests/api/permission-system.test.ts`** - Permission system tests
- **`tests/lib/email-white-label.test.ts`** - White-label email tests

---

## 🚀 How to Use

### Setting Up Custom Branding

1. **Navigate to Settings**
   - Go to `/settings/branding` from the dashboard

2. **Upload Logos**
   - Upload main logo (recommended: 500x200px, PNG/JPG, max 5MB)
   - Upload small logo for emails (recommended: 200x100px, max 1MB)

3. **Configure Colors**
   - Pick primary color (buttons, links)
   - Pick secondary color (headers, titles)
   - Pick accent color (highlights, notifications)
   - Preview colors in real-time

4. **Select Typography**
   - Choose font family from dropdown
   - Available: Inter, Roboto, Open Sans, Lato, Poppins, Montserrat

5. **White-label Options**
   - Toggle "Remove AgentFlow Branding" to hide footer
   - Add custom domain (optional)
   - Add custom CSS (optional, advanced)

6. **Save Changes**
   - Click "Shrani nastavitve" to save
   - Preview changes in the preview section

### Creating Custom Roles

1. **Go to Permission Management**
   - Navigate to `/settings/permissions`

2. **Create New Role**
   - Click "Nova Role" button
   - Enter role name (e.g., "Front Desk Manager")
   - Add description (optional)

3. **Select Permissions**
   - Browse permission categories:
     - **Reservations**: create, edit, delete, view
     - **Reports**: view, export, schedule
     - **Settings**: manage property, manage users
     - **Content**: create, edit, publish
     - **Guests**: view, edit, communicate
   - Check permissions for this role

4. **Save Role**
   - Click "Ustvari Role"
   - Role is now available for assignment

### Managing Property Access

1. **View Property Access**
   - Go to `/settings/permissions`
   - Scroll to "Property Access Control" section

2. **Configure Access** (Admin only)
   - Select user and property
   - Set permissions:
     - ✅ View - Can view property data
     - ✅ Edit - Can edit property details
     - ✅ Delete - Can delete property
     - ✅ Manage Reservations - Can manage bookings
     - ✅ Manage Reports - Can view/create reports
     - ✅ Manage Settings - Can change property settings

3. **Save Changes**
   - Access is saved automatically

### Using White-label Emails

White-label branding is automatically applied to all email templates:

```typescript
import { renderEmailTemplate } from '@/lib/email-templates';

// Render with branding
const { subject, body } = renderEmailTemplate('welcome', {
  guest_name: 'John Doe',
  property_name: 'Hotel Test',
}, {
  logoUrl: 'https://example.com/logo.png',
  primaryColor: '#3B82F6',
  removeAgentFlowBranding: true,
});
```

**Emails affected:**
- Welcome emails
- Pre-arrival instructions
- Post-stay thank you
- Payment confirmations
- Cancellation notices

---

## 🔐 Permissions & Access

### Default Roles

- **ADMIN** - Full access to everything
- **EDITOR** - Can edit content and manage reservations
- **VIEWER** - Read-only access

### Custom Roles

Custom roles can have any combination of permissions:

```typescript
// Example custom role permissions
{
  name: "Front Desk Manager",
  permissions: [
    "reservations.create",
    "reservations.edit",
    "reservations.view",
    "guests.view",
    "guests.edit",
    "reports.view"
  ]
}
```

### Permission Categories

| Category | Permissions |
|----------|-------------|
| **reservations** | create, edit, delete, view, cancel |
| **reports** | view, export, schedule, create |
| **settings** | manage_property, manage_users, manage_billing |
| **content** | create, edit, publish, delete |
| **guests** | view, edit, communicate, export |

---

## 📊 Database Schema

### Branding Model

```prisma
model Branding {
  id                    String   @id @default(cuid())
  userId                String   @unique
  logoUrl               String?
  logoSmall             String?
  primaryColor          String   @default("#3B82F6")
  secondaryColor        String   @default("#1E40AF")
  accentColor           String   @default("#60A5FA")
  fontFamily            String   @default("Inter")
  removeAgentFlowBranding Boolean @default(false)
  customDomain          String?
  customCSS             String?  @db.Text
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  user                  User     @relation(fields: [userId], references: [id])
}
```

### Permission Models

```prisma
model Permission {
  id          String   @id @default(cuid())
  name        String   @unique
  description String
  category    String
  createdAt   DateTime @default(now())
  roles       RolePermission[]
}

model CustomRole {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  isSystem    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id])
  permissions RolePermission[]
}

model RolePermission {
  id         String   @id @default(cuid())
  roleId     String
  permissionId String
  granted    Boolean  @default(true)
  createdAt  DateTime @default(now())
  permission Permission @relation(fields: [permissionId], references: [id])
  customRole CustomRole @relation(fields: [roleId], references: [id])

  @@unique([roleId, permissionId])
}
```

---

## 🧪 Testing

### Run Tests

```bash
# Test branding functionality
npm run test -- tests/api/branding.test.ts

# Test permission system
npm run test -- tests/api/permission-system.test.ts

# Test white-label emails
npm run test -- tests/lib/email-white-label.test.ts
```

### Test Coverage

All new features have comprehensive test coverage:
- ✅ API endpoint tests (GET/PUT/POST)
- ✅ UI component tests
- ✅ Email template rendering tests
- ✅ Permission logic tests

---

## 🔒 Security Considerations

### Logo Upload
- File type validation (images only)
- File size limit (5MB for main, 1MB for small)
- Stored as base64 (consider S3/blob storage for production)

### Permission Checks
- All API routes check authentication
- Admin-only endpoints verify user role
- Property access is enforced at API level

### White-label
- Custom CSS is sanitized (prevent XSS)
- Custom domain requires DNS verification (future)
- Logo URLs are validated

---

## 📝 Migration Guide

### For Existing Installations

1. **Backup Database**
   ```bash
   npx prisma db dump
   ```

2. **Run Migration**
   ```bash
   npx prisma migrate dev --name add_branding_and_permissions
   ```

3. **Regenerate Prisma Client**
   ```bash
   npx prisma generate
   ```

4. **Test Functionality**
   - Verify branding settings page loads
   - Test permission management
   - Check email templates render correctly

### For New Installations

All models are included in the base schema - no additional migration needed.

---

## 🎯 Use Cases

### 1. Property Management Company

**Scenario:** Multi-property hotel chain wants branded experience

**Setup:**
- Upload company logo
- Set brand colors (blue #3B82F6, gold #FFD700)
- Create custom roles:
  - Property Manager (full access to their property)
  - Front Desk (reservations + guests)
  - Housekeeping (tasks only)
- Enable white-label (remove AgentFlow branding)

### 2. Travel Agency

**Scenario:** Agency managing multiple tour properties

**Setup:**
- Upload agency logo
- Configure brand colors
- Set property-level access:
  - Each agent sees only their properties
  - Managers see all properties
- Custom role: "Tour Coordinator"

### 3. White-label SaaS

**Scenario:** Reselling AgentFlow as your own platform

**Setup:**
- Complete white-label (remove all AgentFlow references)
- Custom domain: `app.yourcompany.com`
- Custom CSS for unique branding
- Your logo in all emails

---

## 🐛 Troubleshooting

### Logo Not Showing

**Problem:** Logo upload succeeds but doesn't display

**Solution:**
- Check file size (must be < 5MB)
- Verify file type (PNG/JPG only)
- Clear browser cache
- Check logo URL in database

### Permissions Not Working

**Problem:** User can't access feature despite role assignment

**Solution:**
- Verify role has the permission
- Check property access settings
- Ensure user is assigned to correct role
- Restart application (permission cache)

### Email Branding Not Applied

**Problem:** Emails show default AgentFlow branding

**Solution:**
- Check `removeAgentFlowBranding` is enabled
- Verify logo URL is accessible
- Test email rendering manually
- Check email client (some block images)

---

## 📚 Additional Resources

- **API Documentation:** See OpenAPI spec at `/api/docs`
- **Component Documentation:** Check component JSDoc comments
- **Test Examples:** See test files for usage examples

---

## 🚀 Future Enhancements

Planned improvements:
- [ ] Logo CDN integration (S3/blob storage)
- [ ] Email template editor (visual builder)
- [ ] More font options (Google Fonts integration)
- [ ] Custom domain automatic setup
- [ ] Advanced CSS editor with preview
- [ ] Permission templates (pre-defined role presets)
- [ ] Audit log for permission changes

---

**Version:** 1.0.0  
**Last Updated:** 2026-03-11  
**Author:** AgentFlow Pro Team
