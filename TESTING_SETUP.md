# Admin Panel Testing - Setup & Quick Start Guide

## Quick Start (5 minutes)

### 1. Start the Development Server
```bash
# Terminal 1: Start the app
npm run dev

# App should be available at http://localhost:3000
```

### 2. Create Test Admin Account
```bash
# Option A: Via the app registration
1. Go to http://localhost:3000/register
2. Create admin@test.com account
3. Go to MongoDB and update: { email: "admin@test.com" }.role = "ADMIN"

# Option B: Via MongoDB directly
db.users.updateOne(
  { email: "admin@test.com" },
  { $set: { role: "ADMIN" } }
)
```

### 3. Seed Test Data
```bash
# Create test users, profiles, reports, etc.
npm run db:seed

# Or manually create via app registration and MongoDB
```

### 4. Login to Admin Panel
```
URL: http://localhost:3000/login
Email: admin@test.com
Password: [your admin password]
```

---

## Full Test Environment Setup (15 minutes)

### Prerequisites
- [ ] Node.js 18+ installed
- [ ] MongoDB running locally or Atlas connection
- [ ] Git repository cloned
- [ ] `.env` file configured with:
  ```env
  MONGODB_URI=mongodb://localhost:27017/matrimony
  NEXTAUTH_SECRET=your-secret-key
  NEXTAUTH_URL=http://localhost:3000
  ```

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Setup Database
```bash
# Start MongoDB (if local)
mongod

# Or verify Atlas connection in .env
```

### Step 3: Create Test Users
```bash
# Run database seed script (if available)
npm run db:seed

# Or manually create test data via MongoDB:
```

**Test Users to Create:**
```javascript
// Admin User
db.users.insertOne({
  name: "Admin User",
  email: "admin@test.com",
  passwordHash: "hashed_password", // Use bcrypt hash
  role: "ADMIN",
  status: "ACTIVE",
  profileId: "A0101A00001MC",
  profileType: "GROOM",
  familyClass: "MC",
  verificationStatus: "VERIFIED",
  createdAt: new Date()
})

// Regular Users (5+)
db.users.insertMany([
  {
    name: "Bride User 1",
    email: "bride1@test.com",
    passwordHash: "...",
    role: "USER",
    status: "ACTIVE",
    profileId: "F0101B00001MC",
    profileType: "BRIDE",
    familyClass: "MC",
    verificationStatus: "UNVERIFIED",
    createdAt: new Date()
  },
  // ... more users
])

// Profiles (3+)
db.profiles.insertMany([
  {
    userId: ObjectId("..."), // Reference to user
    age: 28,
    religion: "Hindu",
    caste: "Brahmin",
    location: "Mumbai",
    education: "B.Tech",
    income: 50000,
    bio: "Looking for a life partner",
    profileType: "BRIDE",
    familyClass: "MC",
    profileStatus: "PENDING_APPROVAL",
    createdAt: new Date()
  }
])

// Reports (2+)
db.reports.insertOne({
  reporterId: ObjectId("..."),
  reportedUserId: ObjectId("..."),
  reason: "Inappropriate content",
  description: "Profile contains offensive language",
  status: "OPEN",
  createdAt: new Date()
})

// Verification Documents
db.users.updateOne(
  { _id: ObjectId("...") },
  {
    $set: {
      verificationDocuments: [
        {
          url: "https://example.com/doc.pdf",
          type: "ID_PROOF",
          uploadedAt: new Date()
        }
      ]
    }
  }
)
```

### Step 4: Start Development Server
```bash
npm run dev
```

### Step 5: Open Admin Panel
```
http://localhost:3000/admin
```

---

## Testing Workflow

### Pre-Test Checklist
Before starting tests, verify:
- [ ] Server running (npm run dev)
- [ ] Database connected (check console for "Connected to MongoDB")
- [ ] Test data seeded
- [ ] Admin logged in
- [ ] No console errors
- [ ] All pages loading

### During Testing
1. **Use the Testing Guide**: Follow `ADMIN_TESTING_GUIDE.md`
2. **Use the Quick Checklist**: Reference `ADMIN_TESTING_CHECKLIST.md`
3. **Open DevTools**: F12 or Cmd+Option+I
   - Check Console tab for errors
   - Check Network tab for failed requests
   - Check Application tab for storage issues
4. **Document Issues**: Note any failures in Issue Tracking format

### After Each Feature Test
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Refresh page (F5 or Cmd+R)
- [ ] Verify changes persisted in database
- [ ] Check console for warnings

### Cleanup Between Test Phases
```bash
# Reset database to clean state
npm run db:seed

# Or clear specific collections:
# db.auditLogs.deleteMany({})
# db.reports.deleteMany({})
# etc.
```

---

## Testing Environments

### Local Development
```
URL: http://localhost:3000
Database: Local MongoDB (default)
Usage: Initial development testing
```

### Local Production Build
```bash
# Build production bundle
npm run build

# Start production build
npm start

# Test at http://localhost:3000
```

### Staging (if available)
```
URL: [Your staging domain]
Database: Staging MongoDB
Usage: Final pre-production testing
```

---

## Browser DevTools Tips

### Console Commands
```javascript
// Check authentication
const auth = await fetch('/api/auth/session').then(r => r.json())
console.log(auth)

// Check network requests
// Go to Network tab, filter by Fetch/XHR

// Monitor performance
performance.measure('pageLoad')
console.table(performance.getEntriesByType('measure'))
```

### Network Debugging
1. Open DevTools → Network tab
2. Filter by "admin" to see only admin API calls
3. Click request to see:
   - Request headers
   - Response body
   - Response status code
4. Check for any 401 (Unauthorized) or 500 errors

### Performance Profiling
1. DevTools → Performance tab
2. Click Record (red circle)
3. Perform actions (click buttons, navigate, etc.)
4. Click Stop
5. Analyze flame chart for slow operations

---

## Common Testing Issues & Solutions

### Issue: "401 Unauthorized" errors
**Solution**:
- Verify admin user exists in database
- Check admin user has `role: "ADMIN"`
- Try logging out and logging back in
- Clear cookies: Cmd+Shift+Delete

### Issue: "Cannot connect to database"
**Solution**:
- Verify MongoDB is running (mongod)
- Check MONGODB_URI in .env
- Verify credentials if using Atlas
- Check firewall/network access

### Issue: Changes not persisting
**Solution**:
- Check browser console for errors
- Verify Network tab shows successful save request (200/201)
- Check database directly to see if data was updated
- Clear browser cache

### Issue: Pages load slowly
**Solution**:
- Check Network tab for slow requests
- Look for failed requests (red)
- Check DevTools Performance tab
- Try with browser cache disabled

### Issue: Sidebar not responding
**Solution**:
- Refresh page (F5)
- Check console for JavaScript errors
- Try different browser
- Clear browser cache

---

## Test Data Management

### Viewing Test Data
```javascript
// MongoDB queries to check test data
db.users.countDocuments() // Check user count
db.profiles.countDocuments() // Check profile count
db.reports.find().pretty() // View reports
db.auditLogs.find().pretty() // View audit logs
```

### Creating Specific Test Scenarios

**Scenario 1: User Suspension**
```javascript
// Create a user to suspend
db.users.insertOne({
  name: "Test User",
  email: "suspend@test.com",
  role: "USER",
  status: "ACTIVE"
})

// Then in admin panel: Users → Suspend this user
// Check DB: user.status should become "SUSPENDED"
```

**Scenario 2: Profile Approval**
```javascript
// Create profile with PENDING_APPROVAL status
db.profiles.insertOne({
  userId: ObjectId("..."),
  profileStatus: "PENDING_APPROVAL",
  age: 25,
  // ... other fields
})

// Then in admin panel: Profiles → Approve this profile
// Check DB: profileStatus should become "APPROVED"
```

**Scenario 3: Report Resolution**
```javascript
// Create report
db.reports.insertOne({
  reporterId: ObjectId("..."),
  reportedUserId: ObjectId("..."),
  reason: "Harassment",
  status: "OPEN"
})

// Then in admin panel: Reports → Resolve with action (Suspend/Ban)
// Check DB: report.status should become "RESOLVED"
// Check user.status should change to "SUSPENDED" or "BANNED"
```

---

## Automated Testing (Future)

### Recommended Tools
- **E2E Testing**: Playwright or Cypress
- **Performance**: Lighthouse CI
- **Visual Regression**: Percy or Chromatic

### Example Playwright Test
```typescript
import { test, expect } from '@playwright/test';

test('Admin can login', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.fill('[type="email"]', 'admin@test.com');
  await page.fill('[type="password"]', 'password');
  await page.click('[type="submit"]');
  await expect(page).toHaveURL('/admin');
});
```

---

## Test Report Template

### Test Execution Report

**Project**: Matrimony Admin Panel
**Date**: ________________
**Tester**: ________________
**Environment**: [ ] Local [ ] Staging [ ] Production
**Browser**: ________________
**OS**: ________________

**Summary**
- Total Tests: 300+
- Passed: _____
- Failed: _____
- Pass Rate: ____%
- Duration: _____ hours

**Critical Issues**: _____
**High Issues**: _____
**Medium Issues**: _____
**Low Issues**: _____

**Test Phases Completed**
- [ ] Phase 1: Authentication (30 min)
- [ ] Phase 2: Dashboard (20 min)
- [ ] Phase 3: User Management (45 min)
- [ ] Phase 4: Profile Management (45 min)
- [ ] Phase 5: Analytics (30 min)
- [ ] Phase 6: Verification (40 min)
- [ ] Phase 7: Reports (40 min)
- [ ] Phase 8: Settings (20 min)
- [ ] Phase 9: Responsive Design (30 min)
- [ ] Phase 10: Error Handling (20 min)
- [ ] Phase 11: Performance (20 min)
- [ ] Phase 12: Compliance (20 min)

**Recommendations**
1. _______________
2. _______________
3. _______________

**Sign-off**
- [ ] Ready for Production
- [ ] Needs Fixes
- [ ] Needs Redesign

**Sign-off By**: ________________ **Date**: ________

---

## Resources

### Documentation Files
- `ADMIN_TESTING_GUIDE.md` - Detailed step-by-step testing guide (Part 1)
- `ADMIN_TESTING_CHECKLIST.md` - Quick reference checklist for rapid testing (Part 2)
- `TESTING_SETUP.md` - This file (Part 3)

### Code Files
- Admin routes: `/app/admin/*/page.tsx`
- Admin APIs: `/app/api/admin/*/route.ts`
- Admin components: `/components/admin/`

### Database
- MongoDB connection: Check `lib/mongodb.ts`
- Models: Check `lib/models.ts`

---

## Next Steps After Testing

### If All Tests Pass ✅
1. Run Lighthouse audit (target scores > 80)
2. Test production build locally: `npm run build && npm start`
3. Prepare deployment plan
4. Deploy to staging environment
5. Perform staging testing
6. Deploy to production

### If Issues Found ❌
1. Log all issues with reproduction steps
2. Prioritize by severity (Critical → Low)
3. Fix issues in order of priority
4. Re-test affected features
5. Document all fixes
6. Resume testing from previous checkpoint

### Production Deployment Checklist
- [ ] All tests passing
- [ ] Lighthouse scores > 80
- [ ] No console errors
- [ ] Database backups created
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured
- [ ] Error tracking (Sentry) enabled
- [ ] Deployment window scheduled
- [ ] Team notified

---

## Support & Troubleshooting

### Need Help?
1. Check `ADMIN_TESTING_GUIDE.md` FAQ section
2. Check browser console for errors
3. Check database connection
4. Try clearing cache and refresh
5. Restart dev server

### Report Issues
Create an issue with:
- Feature being tested
- Steps to reproduce
- Expected vs actual result
- Screenshots/videos
- Browser/OS information
- Console errors

