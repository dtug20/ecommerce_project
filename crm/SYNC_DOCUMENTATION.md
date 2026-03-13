# CRM ↔️ Frontend Synchronization System

## Overview

Your CRM system now includes **automatic synchronization** between the CRM database (`shofy_ecommerce`) and the frontend client website database (`shofy`).

## How It Works

### 1. **Automatic Sync** (Real-time)
Whenever you create, update, or delete data in the CRM, it **automatically syncs** to the frontend:

- ✅ **Create/Update Product** → Automatically syncs to frontend
- ✅ **Create/Update Category** → Automatically syncs to frontend  
- ✅ **Create/Update User** → Automatically syncs to frontend
- ✅ **Delete Product/Category/User** → Automatically removed from frontend

### 2. **Manual Sync** (Dashboard Controls)
You can also manually trigger synchronization from the CRM Dashboard:

- **Sync All** - Syncs all products, categories, and users
- **Sync Products** - Syncs only products
- **Sync Categories** - Syncs only categories
- **Sync Users** - Syncs only users

### 3. **Sync Status Monitoring**
The dashboard shows real-time sync status:
- 🟢 **Green Badge** - Data is synced
- 🟡 **Yellow Badge** - Data is out of sync
- 🔴 **Red Badge** - Sync error

## Database Strategy

### Two Separate Databases:
1. **CRM Database** (`shofy_ecommerce`)
   - Used by CRM system (port 8080)
   - Contains: Products, Categories, Users, Orders

2. **Frontend Database** (`shofy`)
   - Used by client website (port 3000)
   - Contains: Same data structure but optimized for frontend

### Data Flow:
```
┌─────────────────┐
│   CRM (8080)    │
│  shofy_ecommerce│
└────────┬────────┘
         │
         │ Auto Sync on Save/Delete
         ▼
┌─────────────────┐
│ Frontend (3000) │
│     shofy       │
└─────────────────┘
```

## Important Notes

### ⚠️ One-Way Sync (CRM → Frontend)
- Synchronization flows **from CRM to Frontend** only
- Changes in the frontend do NOT sync back to CRM
- The CRM is the **source of truth**

### 🔄 Initial Setup
When you first start:
1. The CRM has **8 products, 5 categories, 4 users** (from seed data)
2. The frontend has **its own existing data** (37 products, 15 categories, 6 users)
3. Use "Sync All" to **add** CRM data to frontend (it doesn't replace existing frontend data)

### 📊 Upsert Strategy
- Sync uses **upsert** (update or insert)
- Each CRM item is identified by its unique `_id`
- If the item exists in frontend, it's **updated**
- If the item doesn't exist, it's **created**

## API Endpoints

### Check Sync Status
```bash
GET http://localhost:8080/api/sync/sync-status
```

Response:
```json
{
  "success": true,
  "data": {
    "crm": {
      "products": 8,
      "categories": 5,
      "users": 4
    },
    "frontend": {
      "products": 45,
      "categories": 20,
      "users": 10
    },
    "synced": {
      "products": false,
      "categories": false,
      "users": false
    }
  }
}
```

### Sync All Data
```bash
POST http://localhost:8080/api/sync/sync-all
```

### Sync Only Products
```bash
POST http://localhost:8080/api/sync/sync-products
```

### Sync Only Categories
```bash
POST http://localhost:8080/api/sync/sync-categories
```

### Sync Only Users
```bash
POST http://localhost:8080/api/sync/sync-users
```

## Usage Examples

### Example 1: Add New Product in CRM
1. Go to CRM → Products → Create New Product
2. Fill in product details and save
3. ✅ Product is **automatically synced** to frontend database
4. Check your client website - the new product appears!

### Example 2: Update Category in CRM
1. Go to CRM → Categories → Edit a category
2. Change name, description, or other fields
3. ✅ Changes are **automatically synced** to frontend
4. Refresh your client website - category is updated!

### Example 3: Delete User in CRM
1. Go to CRM → Users → Delete a user
2. ✅ User is **automatically removed** from frontend database
3. User no longer appears on client website

### Example 4: Full Manual Sync
1. Go to CRM Dashboard
2. Click "Sync All" button
3. Wait for confirmation message
4. Check sync status - all badges should be green ✅

## Troubleshooting

### Sync Status Shows "Out of Sync"
This is normal because:
- Frontend may have **additional data** from other sources
- The count shows: `Frontend Count / CRM Count`
- Example: `45/8` means frontend has 45 products, CRM has 8

### How to Make Them Match Exactly?
If you want the frontend to only have CRM data:
1. Delete existing frontend data manually via MongoDB
2. Run "Sync All" from CRM
3. Now frontend will have exactly the same data as CRM

### Verify Sync is Working
1. Create a test product in CRM
2. Check sync status - product count should increase
3. Query frontend database to verify product exists
4. Check client website to see product displayed

## Technical Details

### Auto-Sync Middleware
Located in product/category/user models:
```javascript
// Post-save hook - syncs after create/update
schema.post('save', function(doc, next) {
  SyncService.syncProduct(doc);
  next();
});

// Post-delete hook - removes from frontend
schema.post('findOneAndDelete', function(doc, next) {
  SyncService.syncProduct(doc, 'delete');
  next();
});
```

### Data Mapping
The SyncService maps CRM schema to frontend schema:
- Converts CRM `_id` to frontend `id` string
- Maps category references
- Converts field names to match frontend structure

### Environment Variables
Required in `.env`:
```env
# CRM Database
MONGO_URI=mongodb://127.0.0.1:27017/shofy_ecommerce

# Frontend Database (for sync)
FRONTEND_MONGO_URI=mongodb://127.0.0.1:27017/shofy

# CRM Port
CRM_PORT=8080
```

## Next Steps

1. ✅ **Test the auto-sync**: Create a product in CRM and verify it appears in frontend
2. ✅ **Check dashboard**: Monitor sync status in real-time
3. ✅ **Use manual sync**: Click "Sync All" to ensure all data is synchronized
4. ✅ **Verify on website**: Check your client website to see synchronized data

## Summary

Your CRM is now fully integrated with your frontend client website! Any changes you make in the CRM will **automatically update** the client website in real-time. This ensures that:

- ✅ Product updates appear instantly on your website
- ✅ Category changes reflect immediately
- ✅ User data stays synchronized
- ✅ You have full control with dashboard monitoring and manual sync options

The synchronization system ensures your client website always has the latest data from your CRM! 🎉
