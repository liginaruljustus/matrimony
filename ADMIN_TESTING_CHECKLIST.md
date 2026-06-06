# Admin Panel Testing Checklist - Quick Reference

## Pre-Testing (30 min)
- [ ] Database running and connected
- [ ] All API routes deployed
- [ ] Create admin test user (admin@test.com)
- [ ] Create 5+ regular test users
- [ ] Create test profiles with different statuses
- [ ] Create test payment records
- [ ] Create test reports and verification documents

---

## Phase 1: Authentication & Access (30 min)

**Admin Login**
- [ ] Correct credentials work
- [ ] Wrong password shows error
- [ ] Non-existent email shows error
- [ ] Redirect to dashboard after login
- [ ] Session persists on refresh

**Access Control**
- [ ] Non-admin users blocked from /admin routes
- [ ] Clear cookies → redirected to login
- [ ] Logout works correctly

**Time: 30 min | Status: ⬜ Start**

---

## Phase 2: Dashboard (20 min)

**Layout & Navigation**
- [ ] Page loads without errors
- [ ] 5 stat cards display with correct numbers
- [ ] 4 quick links visible and clickable
- [ ] 3 pending items visible (Payments, Verification, Reports)
- [ ] Platform Health section shows 3 systems (all Connected/Active)

**Sidebar**
- [ ] All 7 navigation items visible
- [ ] Sidebar collapses on mobile
- [ ] Active page highlighted in gold
- [ ] User menu shows logged-in admin
- [ ] Sign Out button works

**Time: 20 min | Status: ⬜ Start**

---

## Phase 3: User Management (45 min)

**User List**
- [ ] Page loads with data table
- [ ] All columns visible (User, Status, Verification, Created, Actions)
- [ ] User data displays correctly
- [ ] Pagination works (page navigation, per-page dropdown)

**Filtering & Search**
- [ ] Search by name filters correctly
- [ ] Search by email filters correctly
- [ ] Status filter works (ACTIVE, SUSPENDED, BANNED, INACTIVE)
- [ ] Verification filter works
- [ ] Reset Filters clears all filters
- [ ] Combining filters works

**User Detail**
- [ ] Detail page loads with all user info
- [ ] Status badge displays with correct color
- [ ] Verification status shows
- [ ] Admin notes display
- [ ] Document section shows (if docs exist)

**Status Changes**
- [ ] Change ACTIVE → SUSPENDED works
- [ ] Change SUSPENDED → ACTIVE works
- [ ] Change to BANNED works
- [ ] Suspend reason field works
- [ ] Changes persist after refresh
- [ ] Status updates in list view

**Admin Notes**
- [ ] Can add notes
- [ ] Notes save
- [ ] Notes persist after refresh

**Error Handling**
- [ ] Invalid user ID shows error
- [ ] Network errors handled gracefully
- [ ] Required fields validate

**Time: 45 min | Status: ⬜ Start**

---

## Phase 4: Profile Management (45 min)

**Profile List**
- [ ] Page loads with data table
- [ ] All columns visible
- [ ] Content score shows as progress bar
- [ ] Profile type shows (Bride/Groom)

**Filtering & Search**
- [ ] Status filter works (PENDING_APPROVAL, APPROVED, REJECTED, FLAGGED)
- [ ] Type filter works (BRIDE, GROOM)
- [ ] Search works
- [ ] Combined filters work
- [ ] Reset works

**Profile Detail**
- [ ] Detail page loads
- [ ] Photos display in grid
- [ ] All personal info displays
- [ ] Family info displays
- [ ] Contact info displays (if verified)

**Photo Gallery**
- [ ] Click photo opens lightbox
- [ ] Lightbox shows full-size image
- [ ] Close button works
- [ ] ESC key closes lightbox

**Moderation**
- [ ] Edit button works
- [ ] Status dropdown works (DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, FLAGGED)
- [ ] Content score slider works (0-100)
- [ ] Rejection reason field appears when REJECTED selected
- [ ] Flag reason field appears when FLAGGED selected
- [ ] Save button works
- [ ] Changes persist

**Rejection Workflow**
- [ ] Can set status to REJECTED
- [ ] Rejection reason required
- [ ] Rejection shows in red box on detail
- [ ] Shows in list view

**Approval Workflow**
- [ ] Can set status to APPROVED
- [ ] Approval date sets automatically
- [ ] Shows as green badge

**Time: 45 min | Status: ⬜ Start**

---

## Phase 5: Analytics Dashboard (30 min)

**Page Load**
- [ ] Page loads without errors
- [ ] No console errors
- [ ] Data loads (spinner disappears)

**Key Metrics**
- [ ] Total Users card shows count + active
- [ ] Total Profiles card shows count + approval rate
- [ ] Gender Distribution shows Bride/Groom counts
- [ ] Interests card shows count + acceptance rate

**Charts & Graphs**
- [ ] Gender Distribution chart displays with progress bars
- [ ] Verification Status chart shows breakdown
- [ ] Profile Status chart shows breakdown
- [ ] User Status chart shows breakdown
- [ ] User Growth table shows last 7 days

**Data Accuracy**
- [ ] Numbers match expected values
- [ ] Percentages calculate correctly
- [ ] Dates format correctly (DD/MM/YYYY)

**Responsive**
- [ ] Mobile view stacks single column
- [ ] Tablet view uses 2 columns
- [ ] Desktop view uses full layout

**Time: 30 min | Status: ⬜ Start**

---

## Phase 6: Verification Management (40 min)

**Verification List**
- [ ] Page loads with pending users
- [ ] Status tabs visible (PENDING, VERIFIED, REJECTED)
- [ ] User info displays (name, email, profile ID)
- [ ] Document count shows

**Status Tabs**
- [ ] PENDING tab shows pending users
- [ ] VERIFIED tab shows verified users
- [ ] REJECTED tab shows rejected users
- [ ] Tab counts accurate

**Search & Filter**
- [ ] Search by name works
- [ ] Search by email works
- [ ] Search by profile ID works

**Bulk Actions (PENDING only)**
- [ ] Can select multiple users
- [ ] Counter shows selected count
- [ ] Approve button works
- [ ] Reject button works
- [ ] Selected users move to correct tab

**Individual Review**
- [ ] Click "Details" opens modal
- [ ] Modal shows user info
- [ ] Documents display with upload dates
- [ ] "View Document" button works
- [ ] Approve button works
- [ ] Reject button works
- [ ] Rejection reason required/displays

**Modal Actions**
- [ ] Approve moves user to VERIFIED tab
- [ ] Reject moves user to REJECTED tab
- [ ] Rejection reason displays in REJECTED tab
- [ ] Modal closes after action

**Time: 40 min | Status: ⬜ Start**

---

## Phase 7: Reports & Moderation (40 min)

**Reports List**
- [ ] Page loads with report data
- [ ] Status tabs visible (OPEN, INVESTIGATING, RESOLVED, DISMISSED)
- [ ] Priority badges show (red/yellow/blue)
- [ ] Report reason displays
- [ ] Reported user shows

**Status Tabs**
- [ ] OPEN tab shows open reports
- [ ] INVESTIGATING tab shows investigating reports
- [ ] RESOLVED tab shows resolved reports
- [ ] DISMISSED tab shows dismissed reports

**Priority System**
- [ ] High priority shows red badge
- [ ] Medium priority shows yellow badge
- [ ] Low priority shows blue badge

**Bulk Actions (OPEN only)**
- [ ] Can select reports
- [ ] Resolve button works
- [ ] Dismiss button works

**Report Details**
- [ ] Click "Investigate" opens modal
- [ ] Modal shows report reason + icon
- [ ] Status badge displays
- [ ] Description displays
- [ ] Reporter info shows
- [ ] Reported user info shows (clickable link to user)
- [ ] Action dropdown available

**Moderation Actions**
- [ ] Can select "Resolve Report Only"
- [ ] Can select "Suspend User" (with notes)
- [ ] Can select "Ban User" (with notes)
- [ ] Can dismiss without action

**Action Results**
- [ ] Resolve Report Only: Report moves to RESOLVED
- [ ] Suspend User: Report status changes, user status becomes SUSPENDED
- [ ] Ban User: Report status changes, user status becomes BANNED
- [ ] Dismiss: Report moves to DISMISSED
- [ ] User status updates in Users list

**Time: 40 min | Status: ⬜ Start**

---

## Phase 8: Settings (20 min)

**Payment Configuration**
- [ ] MC amount field works (default 500)
- [ ] UC amount field works (default 2500)
- [ ] EC amount field works (default 5000)
- [ ] Can change amounts
- [ ] Changes save
- [ ] Changes persist after refresh

**System Configuration**
- [ ] Maintenance Mode toggle works
- [ ] Maintenance Message appears/disappears with toggle
- [ ] Registration Open toggle works
- [ ] Email Notifications toggle works

**Feature Flags**
- [ ] Profile Approval Required toggle works
- [ ] Contact Details Gating toggle works
- [ ] Payment Required toggle works

**Save Functionality**
- [ ] Save button works
- [ ] Success message shows
- [ ] Changes persist across page refresh
- [ ] Multiple changes save together

**Time: 20 min | Status: ⬜ Start**

---

## Phase 9: Responsive Design (30 min)

**Mobile (375px)**
- [ ] Sidebar collapses
- [ ] Content takes full width
- [ ] Tables scroll horizontally if needed
- [ ] Buttons are touch-friendly (≥44px)
- [ ] Text readable without zoom
- [ ] Modals fit on screen
- [ ] No horizontal scrollbar

**Tablet (768px)**
- [ ] Grid layouts adjust (2 columns)
- [ ] Tables readable
- [ ] Sidebar visible or collapsible
- [ ] Buttons clickable

**Desktop (1920px)**
- [ ] Full layout
- [ ] Sidebar visible
- [ ] Multi-column grids
- [ ] All features accessible

**Browsers**
- [ ] Chrome ✓ / ✗
- [ ] Firefox ✓ / ✗
- [ ] Safari ✓ / ✗
- [ ] Edge ✓ / ✗

**Time: 30 min | Status: ⬜ Start**

---

## Phase 10: Error Handling (20 min)

**Invalid URLs**
- [ ] /admin/users/invalid-id shows error
- [ ] /admin/profiles/fake-id shows error
- [ ] /admin/nonexistent shows 404

**Network Issues**
- [ ] Slow network shows loading spinner
- [ ] Network error shows message
- [ ] Can retry after error

**Validation**
- [ ] Required fields validate
- [ ] Invalid data rejected
- [ ] Error messages clear

**Edge Cases**
- [ ] Empty lists show empty state
- [ ] Missing data handled gracefully
- [ ] Concurrent updates handled
- [ ] Rapid clicks don't cause errors

**Time: 20 min | Status: ⬜ Start**

---

## Phase 11: Performance (20 min)

**Lighthouse Audit** (Each Page)
- [ ] Dashboard: Performance > 80
- [ ] Users: Performance > 80
- [ ] Profiles: Performance > 80
- [ ] Analytics: Performance > 80
- [ ] Verification: Performance > 80
- [ ] Reports: Performance > 80
- [ ] Settings: Performance > 80

**Load Times**
- [ ] Dashboard loads < 2s
- [ ] User list loads < 1.5s
- [ ] Analytics loads < 2s
- [ ] Report list loads < 1.5s

**Accessibility**
- [ ] Lighthouse Accessibility > 90
- [ ] Keyboard navigation works
- [ ] Color contrast sufficient

**Time: 20 min | Status: ⬜ Start**

---

## Phase 12: Compliance & Logging (20 min)

**Audit Logging**
- [ ] User status change logged
- [ ] Profile approval logged
- [ ] Verification approval logged
- [ ] Report resolution logged
- [ ] Settings change logged

**Audit Log Fields** (Check DB)
- [ ] adminId recorded
- [ ] action recorded
- [ ] targetId recorded
- [ ] changes.before recorded
- [ ] changes.after recorded
- [ ] timestamp recorded

**Data Integrity**
- [ ] No data loss on actions
- [ ] Changes reflected in DB
- [ ] Relationships maintained
- [ ] Foreign keys valid

**Time: 20 min | Status: ⬜ Start**

---

## Total Testing Time
- **Estimated**: 12-14 hours
- **Suggested Schedule**: 
  - Day 1: Phases 1-4 (2.5 hours)
  - Day 2: Phases 5-8 (2.5 hours)
  - Day 3: Phases 9-12 (2.5 hours)
  - Contingency: 4+ hours for bug fixes

---

## Issue Tracking Template

**Issue #: ___**
- **Feature**: _______________
- **Severity**: Critical / High / Medium / Low
- **Steps to Reproduce**:
  1. _______________
  2. _______________
  3. _______________
- **Expected**: _______________
- **Actual**: _______________
- **Screenshots**: [Attach]
- **Browser/Device**: _______________
- **Status**: Open / In Progress / Fixed / Closed

---

## Sign-Off

| Field | Value |
|-------|-------|
| **Total Checks** | 300+ |
| **Passed** | _____ |
| **Failed** | _____ |
| **Pass Rate** | ____% |
| **Critical Issues** | _____ |
| **High Issues** | _____ |
| **Medium Issues** | _____ |
| **Low Issues** | _____ |
| **Tester Name** | _________________ |
| **Date** | _________________ |
| **Ready for Production** | [ ] YES  [ ] NO |
| **Sign-off** | _________________ |

---

## Quick Links for Rapid Testing

**Test URLs**
- Dashboard: http://localhost:3000/admin
- Users: http://localhost:3000/admin/users
- Profiles: http://localhost:3000/admin/profiles
- Analytics: http://localhost:3000/admin/analytics
- Verification: http://localhost:3000/admin/verification
- Reports: http://localhost:3000/admin/reports
- Settings: http://localhost:3000/admin/settings

**DevTools Commands** (Browser Console)
```javascript
// Check if authenticated
localStorage.getItem('__Secure-next-auth.session-token')

// Clear cache
sessionStorage.clear(); localStorage.clear();

// Monitor API calls
// Use Network tab in DevTools
```

