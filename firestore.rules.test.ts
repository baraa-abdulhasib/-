/**
 * Security Rules Verification Suite (Dirty Dozen Payloads)
 * Verifies that all 12 adversarial payloads defined in security_spec.md are rejected.
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: { uid?: string; email?: string; email_verified?: boolean } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TEST_CASES: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Unverified Admin Email Spoof on Article Create',
    collectionPath: '/articles/art-1',
    operation: 'create',
    auth: { uid: 'spoof-1', email: 'baraaabdulhasib0@gmail.com', email_verified: false },
    payload: { id: 'art-1', title: 'Spoofed' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Shadow Field Injection on Article Create',
    collectionPath: '/articles/art-1',
    operation: 'create',
    auth: { uid: 'admin-1', email: 'baraaabdulhasib0@gmail.com', email_verified: true },
    payload: { id: 'art-1', isGhostField: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'ID Poisoning on Article Path',
    collectionPath: '/articles/invalid id with spaces!',
    operation: 'create',
    auth: { uid: 'admin-1', email: 'baraaabdulhasib0@gmail.com', email_verified: true },
    payload: { id: 'invalid id with spaces!' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Unauthenticated Article Deletion',
    collectionPath: '/articles/art-showcase-1',
    operation: 'delete',
    auth: null,
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Oversized Title on Article Create',
    collectionPath: '/articles/art-1',
    operation: 'create',
    auth: { uid: 'admin-1', email: 'baraaabdulhasib0@gmail.com', email_verified: true },
    payload: { id: 'art-1', title: 'x'.repeat(2000) },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Unauthorized Site Settings Tampering',
    collectionPath: '/site_settings/main',
    operation: 'update',
    auth: { uid: 'user-2', email: 'visitor@example.com', email_verified: true },
    payload: { siteName: 'Hacked' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'PII Leak on Contact Messages (get by non-admin)',
    collectionPath: '/contact_messages/msg-1',
    operation: 'get',
    auth: { uid: 'user-2', email: 'visitor@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'PII Leak on Contact Messages (list by non-admin)',
    collectionPath: '/contact_messages',
    operation: 'list',
    auth: { uid: 'user-2', email: 'visitor@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Contact Message Pre-Marked as Read or With Ghost Key',
    collectionPath: '/contact_messages/msg-1',
    operation: 'create',
    auth: null,
    payload: {
      id: 'msg-1',
      name: 'Visitor',
      email: 'visitor@example.com',
      message: 'Hello',
      createdAt: '2026-11-08',
      read: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Analytics Arbitrary Deletion by Non-Admin',
    collectionPath: '/site_analytics/main',
    operation: 'delete',
    auth: { uid: 'user-2', email: 'visitor@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Analytics Negative Counter Poisoning',
    collectionPath: '/site_analytics/main',
    operation: 'update',
    auth: null,
    payload: { totalSiteVisits: -500 },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Self-Privilege Escalation in /admins',
    collectionPath: '/admins/user-2',
    operation: 'create',
    auth: { uid: 'user-2', email: 'visitor@example.com', email_verified: true },
    payload: { uid: 'user-2', email: 'visitor@example.com', role: 'admin', addedAt: '2026-11-08' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 13,
    name: 'Analytics Stat Spoofing or Resetting by Non-Admin',
    collectionPath: '/site_analytics/main',
    operation: 'update',
    auth: null,
    payload: {
      totalSiteVisits: 999999999,
      uniqueVisitors: 0,
      dailyStats: [],
      articleViews: {},
      writerVisits: {},
      categoryVisits: {},
      lastUpdated: '2026-11-09',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 14,
    name: 'Invalid Email Format in Contact Message',
    collectionPath: '/contact_messages/msg-2',
    operation: 'create',
    auth: null,
    payload: {
      id: 'msg-2',
      name: 'Spammer',
      email: 'not-an-email',
      message: 'Spam message',
      createdAt: '2026-11-09',
      read: false,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
];
