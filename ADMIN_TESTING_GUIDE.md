# Admin Panel Testing Guide

## Pre-Testing Setup

### Environment Verification
- [ ] Confirm database is running and connected
- [ ] Verify all API routes are deployed
- [ ] Check `.env` file has correct database URL
- [ ] Ensure NextAuth is properly configured
- [ ] Confirm Cloudinary credentials are set (for image uploads)

### Test Users to Create
```
Admin User:
- Email: admin@test.com
- Password: Test@12345
- Role: ADMIN

Test Users (for moderation):
- User 1: bride1@test.com (Bride profile, MC family class)
- User 2: groom1@test.com (Groom profile, UC family class)
- User 3: suspended@test.com (For testing suspension)
```

### Database Seed Data
Create test data before starting:
- [ ] At least 5 test users with varying statuses
- [ ] At least 3 profiles with different approval statuses
- [ ] At least 2 payment records in different approval states
- [ ] At least 2 user reports with different reasons
- [ ] At least 2 verification documents pending review

---

## Part 1: Authentication & Access Control (30 minutes)

### 1.1 Admin Login
- [ ] Navigate to `/login`
- [ ] Enter admin email (admin@test.com)
- [ ] Enter correct password
- [ ] Verify redirected to `/admin/dashboard`
- [ ] Verify session is created
- [ ] Refresh page - verify still logged in

### 1.2 Wrong Credentials
- [ ] Try login with wrong password
- [ ] Verify error message shown
- [ ] Try login with non-existent email
- [ ] Verify error message shown

### 1.3 Access Control - Non-Admins
- [ ] Create a regular USER account
- [ ] Login with USER account
- [ ] Try accessing `/admin` directly
- [ ] Verify redirected to `/dashboard` (or error page)
- [ ] Try accessing `/admin/users`
- [ ] Verify access denied

### 1.4 Session Protection
- [ ] Login as admin
- [ ] Clear session/cookies
- [ ] Try accessing `/admin/analytics`
- [ ] Verify redirected to login
- [ ] Login again
- [ ] Verify can access admin pages

### 1.5 Logout
- [ ] Login as admin
- [ ] Click "Sign Out" button in sidebar
- [ ] Verify redirected to login page
- [ ] Try accessing `/admin`
- [ ] Verify redirected to login

---

## Part 2: Dashboard (20 minutes)

### 2.1 Dashboard Loads
- [ ] Navigate to `/admin`
- [ ] Verify page loads without errors
- [ ] Check console for errors
- [ ] Verify header shows "Dashboard"

### 2.2 Stat Cards
- [ ] Verify 5 stat cards visible (Users, Active Users, Profiles, Interests, Pending Payments)
- [ ] Verify numbers display correctly
- [ ] Check stat card styling (colors, icons, layout)
- [ ] Click on Pending Payments card - verify navigates to `/admin/payments`

### 2.3 Quick Links
- [ ] Verify 4 quick links visible (Users, Profiles, Analytics, Reports)
- [ ] Click each link and verify navigation works
- [ ] Verify link descriptions are clear

### 2.4 Pending Items Section
- [ ] Verify 3 cards visible (Payments, Verification, Platform Health)
- [ ] Click Payments card - verify navigates to `/admin/payments`
- [ ] Click Verification card - verify navigates to `/admin/verification`
- [ ] Check Platform Health section shows all systems (Database, Auth, File Storage)

### 2.5 Sidebar Navigation
- [ ] Click Dashboard icon - verify active state
- [ ] Click Users - verify navigates and sidebar updates
- [ ] Click Profiles - verify navigates and sidebar updates
- [ ] Click Analytics - verify navigates and sidebar updates
- [ ] Click Settings - verify navigates and sidebar updates
- [ ] Click Verification - verify navigates and sidebar updates
- [ ] Click Reports - verify navigates and sidebar updates

### 2.6 Responsive Design
- [ ] Resize to mobile (375px)
- [ ] Verify stat cards stack vertically
- [ ] Verify quick links stack vertically
- [ ] Click sidebar toggle button (←)
- [ ] Verify sidebar collapses
- [ ] Verify content expands to fill space
- [ ] Click toggle again - verify sidebar expands

---

## Part 3: User Management (45 minutes)

### 3.1 User List Page
- [ ] Navigate to `/admin/users`
- [ ] Verify page loads with data table
- [ ] Check table has columns: User, Status, Verification, Created, Actions
- [ ] Verify user data displays correctly
- [ ] Check pagination shows correct page/total

### 3.2 Filtering & Search
- [ ] Use search box - search for user by name
- [ ] Verify results filter correctly
- [ ] Clear search - verify all users shown again
- [ ] Use Status filter dropdown
- [ ] Select "ACTIVE" - verify only active users shown
- [ ] Select "SUSPENDED" - verify suspended users shown
- [ ] Select "All Status" - verify all users shown again
- [ ] Use Verification filter
- [ ] Try combining search + filters
- [ ] Click Reset Filters - verify filters clear

### 3.3 Table Actions
- [ ] Hover over a row - verify row highlights
- [ ] Click "View" action button - verify navigates to user detail page
- [ ] Go back - verify on users list
- [ ] Click "Review" action - verify navigates to user detail

### 3.4 Pagination
- [ ] Set "Show 10 per page" - verify limit changes
- [ ] Navigate to page 2 - verify different users shown
- [ ] Click page 1 - verify back on first page
- [ ] Set back to "25 per page"

### 3.5 User Detail Page
- [ ] Click "View" on a user
- [ ] Verify user details display:
  - Name, email, profile ID
  - Status (with color badge)
  - Verification status
  - Creation date
  - Last login (if available)
  - Verification documents (if any)
  - Admin notes

### 3.6 User Status Changes
- [ ] On user detail page, find Status dropdown
- [ ] Change from "ACTIVE" to "SUSPENDED"
- [ ] Verify dialog/modal appears confirming action
- [ ] Verify suspend reason field appears
- [ ] Enter reason: "Suspicious activity"
- [ ] Click confirm - verify status changes
- [ ] Verify user is now marked as SUSPENDED
- [ ] Go back to list - verify user shows SUSPENDED status
- [ ] Go back to detail page
- [ ] Change from "SUSPENDED" to "ACTIVE"
- [ ] Verify changes apply
- [ ] Try changing to "BANNED"
- [ ] Verify "BANNED" status applies

### 3.7 Verification Document Review
- [ ] On user detail, scroll to Verification Documents section
- [ ] If documents exist, verify they display
- [ ] Click on document - verify document opens/preview
- [ ] Verify upload date shows
- [ ] Change verification status from PENDING to VERIFIED
- [ ] Verify status updates and shows confirmed

### 3.8 Admin Notes
- [ ] In admin notes section, add a note: "Test note about this user"
- [ ] Verify note saves
- [ ] Refresh page
- [ ] Verify note persists

### 3.9 Error Handling
- [ ] Try changing status without required field - verify error
- [ ] Try searching with special characters - verify handles correctly
- [ ] Load user detail with invalid ID in URL - verify error message

---

## Part 4: Profile Management (45 minutes)

### 4.1 Profile List Page
- [ ] Navigate to `/admin/profiles`
- [ ] Verify page loads with data table
- [ ] Check table has columns: Profile, Type, Status, Content Score, Created
- [ ] Verify profile data displays correctly

### 4.2 Profile Filters
- [ ] Use Status filter - select "PENDING_APPROVAL"
- [ ] Verify only pending profiles shown
- [ ] Use Type filter - select "BRIDE"
- [ ] Verify only bride profiles shown
- [ ] Combine filters (PENDING + BRIDE)
- [ ] Use search - search by name or email
- [ ] Click Reset Filters

### 4.3 Content Score Progress Bars
- [ ] On list, verify content score shows as progress bar
- [ ] Verify score 0-33 shows red
- [ ] Verify score 34-66 shows yellow
- [ ] Verify score 67-100 shows green

### 4.4 Profile Detail Page
- [ ] Click "Review" or "View" on a profile
- [ ] Verify profile detail page loads
- [ ] Check all sections display:
  - Profile photos (if any)
  - Personal info (age, religion, caste, location, etc.)
  - Profile type (Bride/Groom)
  - Status badge
  - Rejection reason (if rejected)
  - Flag reason (if flagged)

### 4.5 Photo Gallery
- [ ] If profile has photos, verify grid layout
- [ ] Click on a photo - verify lightbox opens
- [ ] Verify photo displays fullscreen
- [ ] Click close button - verify lightbox closes
- [ ] Press Escape key - verify lightbox closes

### 4.6 Edit Moderation Fields
- [ ] Scroll to moderation section
- [ ] Click "Edit" button
- [ ] Change profile status to "APPROVED"
- [ ] Verify profile approval date updates
- [ ] Click "Save Changes"
- [ ] Verify changes save
- [ ] Go back to list - verify status updated

### 4.7 Content Scoring
- [ ] Click "Edit" on moderation section
- [ ] Find "Content Score" slider
- [ ] Drag slider to 85
- [ ] Verify score displays "85/100"
- [ ] Click save - verify score persists

### 4.8 Rejection Workflow
- [ ] Change status to "REJECTED"
- [ ] Verify "Rejection Reason" field appears
- [ ] Enter reason: "Photos are unclear"
- [ ] Click save
- [ ] Go back to list
- [ ] Go back to detail - verify rejection reason shows in red box

### 4.9 Flagging Profiles
- [ ] Change status to "FLAGGED"
- [ ] Verify "Flag Reason" field appears
- [ ] Enter: "Suspicious profile content"
- [ ] Save changes
- [ ] Verify flag displays in orange box

### 4.10 Moderation Notes
- [ ] In Moderation Notes textarea, add note
- [ ] Save
- [ ] Refresh - verify note persists

---

## Part 5: Analytics Dashboard (30 minutes)

### 5.1 Page Load
- [ ] Navigate to `/admin/analytics`
- [ ] Verify page loads
- [ ] Check console for errors
- [ ] Verify data loads (no spinner stuck)

### 5.2 Key Metric Cards
Verify all 4 metric cards display:
- [ ] Total Users (with active count)
- [ ] Total Profiles (with approval rate)
- [ ] Gender Distribution (Brides/Grooms)
- [ ] Interests & Matches (with acceptance rate)

### 5.3 Secondary Metrics
- [ ] Payment Status card shows:
  - [ ] Pending Review count
  - [ ] Approved count
- [ ] Profile Status card shows:
  - [ ] Pending Approval count
  - [ ] Rejected count

### 5.4 Distribution Charts
- [ ] Gender Distribution chart displays with progress bars
- [ ] Verify Bride count and percentage
- [ ] Verify Groom count and percentage
- [ ] Verification Status chart shows multiple statuses
- [ ] Profile Status chart shows all status types
- [ ] User Status chart shows active/suspended/banned/inactive

### 5.5 User Growth Chart
- [ ] Scroll to "User Growth (Last 30 Days)" section
- [ ] Verify table shows dates and new user counts
- [ ] Verify visual bars show growth trend
- [ ] Check last 7 days are displayed
- [ ] Verify dates are formatted correctly (DD/MM/YYYY)

### 5.6 Responsive Design
- [ ] Resize to tablet (768px)
- [ ] Verify cards stack appropriately
- [ ] Verify charts are readable
- [ ] Resize to mobile (375px)
- [ ] Verify single column layout
- [ ] Verify text is readable without zooming

---

## Part 6: Verification Management (40 minutes)

### 6.1 Verification Page Load
- [ ] Navigate to `/admin/verification`
- [ ] Verify page loads with pending verifications
- [ ] Check table shows user info and document count

### 6.2 Status Tabs
- [ ] Click "PENDING" tab - verify shows pending users
- [ ] Click "VERIFIED" tab - verify shows verified users
- [ ] Click "REJECTED" tab - verify shows rejected users
- [ ] Go back to PENDING tab

### 6.3 Search & Filter
- [ ] Use search box - search for user by name
- [ ] Verify results filter
- [ ] Search by email
- [ ] Search by profile ID
- [ ] Clear search - verify all results shown

### 6.4 Row Selection & Bulk Actions
- [ ] Check the checkbox on first row
- [ ] Verify row highlights
- [ ] Verify bulk action buttons appear (Approve, Reject)
- [ ] Select 3 rows total
- [ ] Verify counter shows "3 selected"
- [ ] Click "✓ Approve" button
- [ ] Verify users move to VERIFIED tab
- [ ] Check number decreased on PENDING tab

### 6.5 Rejection Workflow
- [ ] Go back to PENDING tab
- [ ] Select 1 user
- [ ] Click "✗ Reject" button
- [ ] Verify textarea appears for rejection reason
- [ ] Enter reason: "Document quality too low"
- [ ] Click "Confirm" button
- [ ] Verify user moves to REJECTED tab
- [ ] Go back to REJECTED - verify rejection reason shows

### 6.6 Individual User Review
- [ ] Go to PENDING tab
- [ ] Click "Details" action on a row
- [ ] Verify modal/dialog opens showing:
  - [ ] User name and email
  - [ ] Profile ID
  - [ ] Status badge
  - [ ] Document count
  - [ ] Document previews with upload dates
  - [ ] Approve and Reject buttons

### 6.7 Document Preview
- [ ] In detail modal, verify documents display
- [ ] Click "👁 View Document" button
- [ ] Verify document opens in new tab/window
- [ ] Go back to modal

### 6.8 Individual Approval/Rejection
- [ ] In detail modal, click "✓ Approve Verification"
- [ ] Verify modal closes
- [ ] Verify user moves to VERIFIED tab
- [ ] Go to PENDING again
- [ ] Click Details on another user
- [ ] Click "✗ Reject" button
- [ ] Verify textarea appears
- [ ] Enter rejection reason
- [ ] Click confirm
- [ ] Verify user moves to REJECTED tab

---

## Part 7: Reports & Moderation (40 minutes)

### 7.1 Reports Page Load
- [ ] Navigate to `/admin/reports`
- [ ] Verify page loads with report data
- [ ] Check table has columns: Report, Priority, Reported User, Status, Reported

### 7.2 Status Tabs
- [ ] Verify 4 tabs visible: OPEN, INVESTIGATING, RESOLVED, DISMISSED
- [ ] Click "OPEN" tab - verify shows open reports
- [ ] Click "RESOLVED" tab - verify shows resolved reports
- [ ] Click "DISMISSED" tab - verify shows dismissed reports
- [ ] Go back to OPEN tab

### 7.3 Priority System
- [ ] Verify high priority shows red badge
- [ ] Verify medium priority shows yellow badge
- [ ] Verify low priority shows blue badge

### 7.4 Search & Filter
- [ ] Use search box - search for report reason
- [ ] Verify results filter
- [ ] Search by keywords
- [ ] Clear search

### 7.5 Row Selection & Bulk Actions (OPEN reports only)
- [ ] Check checkbox on first report
- [ ] Verify row highlights
- [ ] Verify bulk action buttons appear (Resolve, Reject)
- [ ] Select 2 reports
- [ ] Click "Resolve" button
- [ ] Verify reports disappear from OPEN tab
- [ ] Go to RESOLVED tab - verify reports show

### 7.6 Report Detail Modal
- [ ] Go to OPEN tab
- [ ] Click "Investigate" action on a report
- [ ] Verify modal opens showing:
  - [ ] Report reason with priority icon
  - [ ] Status badge
  - [ ] Description/details
  - [ ] Reporter info (name, email, profile ID)
  - [ ] Reported user info (name, email, profile ID, status)
  - [ ] Action dropdown (Select action...)

### 7.7 Moderation Actions
- [ ] In modal, click "Action to Take" dropdown
- [ ] Verify 3 options:
  - [ ] "✓ Resolve Report Only"
  - [ ] "⏸️ Suspend User"
  - [ ] "🚫 Ban User"

### 7.8 Resolve Only Action
- [ ] Select "✓ Resolve Report Only"
- [ ] Verify no additional fields appear
- [ ] Click "Resolve Report" button
- [ ] Verify modal closes
- [ ] Verify report moves from OPEN to RESOLVED tab

### 7.9 Suspend User Action
- [ ] Go back to OPEN tab
- [ ] Click Details on another report
- [ ] Select "⏸️ Suspend User" from dropdown
- [ ] Verify notes textarea appears
- [ ] Enter note: "Suspended due to harassment report"
- [ ] Click "Suspend User" button
- [ ] Verify modal closes
- [ ] Verify report status changes to INVESTIGATING
- [ ] Go to `/admin/users` - find the reported user
- [ ] Verify user now shows "SUSPENDED" status

### 7.10 Ban User Action
- [ ] Go back to `/admin/reports`
- [ ] Click Details on another report
- [ ] Select "🚫 Ban User" from dropdown
- [ ] Enter note: "Banned due to multiple violations"
- [ ] Click "Ban User" button
- [ ] Go to `/admin/users`
- [ ] Find reported user - verify status is "BANNED"

### 7.11 Dismiss Report
- [ ] Go back to OPEN reports
- [ ] Click Details on a report
- [ ] Click "Dismiss" button (without selecting action)
- [ ] Verify report moves to DISMISSED tab

---

## Part 8: Settings (20 minutes)

### 8.1 Settings Page Load
- [ ] Navigate to `/admin/settings`
- [ ] Verify page loads
- [ ] Check all sections visible:
  - [ ] Payment Amounts
  - [ ] System Configuration
  - [ ] Feature Flags

### 8.2 Payment Configuration
- [ ] Verify 3 payment amount fields:
  - [ ] MC Family Class
  - [ ] UC Family Class
  - [ ] EC Family Class
- [ ] Change MC from 500 to 750
- [ ] Verify value updates in input
- [ ] Click Save Settings
- [ ] Verify success message
- [ ] Refresh page
- [ ] Verify MC still shows 750

### 8.3 System Configuration Toggles
- [ ] Verify Maintenance Mode toggle
- [ ] Turn ON Maintenance Mode
- [ ] Verify Maintenance Message textarea appears
- [ ] Enter message: "System under maintenance"
- [ ] Turn OFF toggle
- [ ] Verify textarea disappears
- [ ] Test Registration Open toggle - turn OFF
- [ ] Test Email Notifications toggle
- [ ] Save settings

### 8.4 Feature Flags
- [ ] Verify Profile Approval Required toggle
- [ ] Turn it ON
- [ ] Verify toggle changes state
- [ ] Turn it OFF
- [ ] Test Contact Details Gating toggle
- [ ] Test Payment Required toggle
- [ ] Save all changes

### 8.5 Save Functionality
- [ ] Make multiple changes across different sections
- [ ] Click "Save Settings"
- [ ] Verify success message appears
- [ ] Refresh page
- [ ] Verify all changes persisted

### 8.6 Error Handling
- [ ] Try setting negative payment amount
- [ ] Verify validation error (if implemented)
- [ ] Try extremely large number
- [ ] Click save and verify handles gracefully

---

## Part 9: Edge Cases & Error Handling (30 minutes)

### 9.1 Invalid URLs
- [ ] Try accessing `/admin/users/invalid-id`
- [ ] Verify error message shown
- [ ] Try accessing `/admin/profiles/fake-id`
- [ ] Verify error handling

### 9.2 Network Errors
- [ ] Open DevTools Network tab
- [ ] Set throttling to "Slow 3G"
- [ ] Navigate to analytics page
- [ ] Verify loading spinner shows
- [ ] Wait for data to load (slower)
- [ ] Verify data loads successfully
- [ ] Reset throttling to normal

### 9.3 Rapid Clicks
- [ ] Open user list
- [ ] Rapidly click different status filters
- [ ] Verify no errors or duplicate requests
- [ ] Verify final filter state is correct

### 9.4 Concurrent Updates
- [ ] Open user detail in 2 browser tabs
- [ ] Change status in tab 1
- [ ] Try to change in tab 2
- [ ] Verify both changes handled correctly

### 9.5 Form Validation
- [ ] Try to save user changes without required fields
- [ ] Verify validation error message
- [ ] Try to submit report action without selecting an action
- [ ] Verify error shown

### 9.6 Missing Data
- [ ] Try user without documents
- [ ] Verify "no documents" message shown
- [ ] Try report without description
- [ ] Verify page still works

---

## Part 10: Cross-Browser & Responsive (30 minutes)

### 10.1 Desktop (1920x1080)
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Verify all features work
- [ ] Check styling consistency
- [ ] Verify no horizontal scrollbars

### 10.2 Tablet (768x1024)
- [ ] Resize or test on tablet device
- [ ] Verify sidebar collapses appropriately
- [ ] Verify data table is readable
- [ ] Verify buttons are clickable
- [ ] Verify modals fit on screen

### 10.3 Mobile (375x667)
- [ ] Resize to mobile size
- [ ] Verify sidebar collapses to hamburger
- [ ] Verify single column layout
- [ ] Verify touch targets are at least 44px
- [ ] Verify text is readable without zooming
- [ ] Verify no horizontal scrolling

### 10.4 Mobile Interactions
- [ ] Test scrolling through long lists
- [ ] Test clicking buttons
- [ ] Test form input on mobile keyboard
- [ ] Test modals/dialogs on mobile

---

## Part 11: Performance (20 minutes)

### 11.1 Lighthouse Audit
- [ ] Open DevTools
- [ ] Run Lighthouse audit for each page:
  - [ ] Dashboard
  - [ ] Users
  - [ ] Profiles
  - [ ] Analytics
  - [ ] Verification
  - [ ] Reports
  - [ ] Settings
- [ ] Check Performance score > 80
- [ ] Check Accessibility score > 90
- [ ] Check Best Practices score > 90

### 11.2 Load Times
- [ ] Monitor network tab
- [ ] Measure load time for data-heavy pages:
  - [ ] Analytics (should load within 2 seconds)
  - [ ] User list with 25 items (should load within 1.5 seconds)
  - [ ] Profile list (should load within 1.5 seconds)
- [ ] Verify no unoptimized images

### 11.3 Bundle Size
- [ ] Check console for any large dependencies
- [ ] Verify component sizes are reasonable
- [ ] Check for duplicate libraries

---

## Part 12: Audit Logging & Compliance (20 minutes)

### 12.1 Action Tracking
- [ ] Change a user's status to SUSPENDED
- [ ] Change a profile's approval status
- [ ] Approve a verification
- [ ] Resolve a report
- [ ] Update settings

### 12.2 Audit Log Verification (via Database)
- [ ] Query audit logs in MongoDB
- [ ] Verify each action has:
  - [ ] adminId (who did it)
  - [ ] action (what was done)
  - [ ] targetId (what was affected)
  - [ ] changes.before (original state)
  - [ ] changes.after (new state)
  - [ ] timestamp (when it happened)

### 12.3 Admin Attribution
- [ ] Verify each action shows admin who performed it
- [ ] Check resolvedBy field on resolved reports
- [ ] Check approvedBy field on approved profiles

---

## Test Results Summary

### Checklist Counter
- Total Checklist Items: ~300
- Items Passed: _____ / 300
- Items Failed: _____ / 300
- Pass Rate: _____%

### Critical Issues Found
1. _________________________
2. _________________________
3. _________________________

### Minor Issues Found
1. _________________________
2. _________________________
3. _________________________

### Recommendations
- _________________________
- _________________________
- _________________________

### Sign-off
- **Tester Name**: _________________
- **Date**: _________________
- **Ready for Production**: [ ] YES  [ ] NO
- **Notes**: _________________________

---

## Testing Commands

### Database Reset (For Fresh Testing)
```bash
# Clear all test data and reseed
npm run db:seed

# Or manually in MongoDB:
# db.users.deleteMany({})
# db.profiles.deleteMany({})
# etc.
```

### Build & Test Production Build
```bash
# Build production version
npm run build

# Start production build locally
npm start

# Test at http://localhost:3000
```

### Check Logs
```bash
# Terminal where npm start is running shows all logs
# Browser DevTools Console shows client-side logs
# Browser DevTools Network shows API calls
```

---

## Notes for Testers

1. **Test Data**: Use consistent test users across all tests
2. **Screenshots**: Take screenshots of any issues
3. **Timing**: Allocate ~3 hours for full test suite
4. **Isolation**: Test one feature at a time
5. **Documentation**: Record any bugs with steps to reproduce
6. **Rollback**: Keep backups of test database before major changes
7. **Automation**: Could automate repetitive tests later with Playwright/Cypress

