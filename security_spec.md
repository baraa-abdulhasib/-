# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Articles (`/articles/{articleId}`)**:
   - Publicly readable (`get`, `list`) when `resource.data.id is string && resource.data.id.size() <= 128`.
   - Only verified platform administrators (`isAdmin()`) can create, update, or delete articles.
   - `articleId` must match `^[a-zA-Z0-9_\-]+$` (`<= 128` chars) and equal `incoming().id`.
   - Every string field (`slug`, `title`, `subtitle`, `excerpt`, `categorySlug`, `categoryName`, `publishedAt`, `hijriDate`, `coverImage`, `coverCaption`) and bounded array (`tags`, `content`, `footnotes`) is strictly type- and size-checked.

2. **Site Settings (`/site_settings/{settingId}`)**:
   - Publicly readable (`get`) for `settingId == 'main'`.
   - Only verified platform administrators (`isAdmin()`) can create, update, or delete `/site_settings/main`.

3. **Site Analytics (`/site_analytics/{analyticsId}`)**:
   - Publicly readable (`get`) for `analyticsId == 'main'`.
   - Create and update allowed on `analyticsId == 'main'` only when `isValidSiteAnalytics(incoming())` passes and `affectedKeys().hasOnly(...)` matches the exact schema keys.
   - Delete is strictly restricted to `isAdmin()`.

4. **Contact Messages (`/contact_messages/{messageId}`) — PII Isolation**:
   - Anyone can `create` a valid contact message with `read == false` and bounded `name` (`<= 200`), `email` (`<= 320`), `message` (`<= 5000`), and `createdAt` (`<= 64`).
   - Only `isAdmin()` can `get`, `list`, `update`, or `delete` contact messages (preventing any PII leak of visitor emails/messages).

5. **Admins (`/admins/{adminUid}`)**:
   - Only `isAdmin()` can read or write `/admins/{adminUid}`.
   - Bootstrapped admin is verified email `baraaabdulhasib0@gmail.com` with `request.auth.token.email_verified == true`.

## 2. The "Dirty Dozen" Payloads
1. **Unverified Admin Email Spoof**: Authenticated user with `email == 'baraaabdulhasib0@gmail.com'` but `email_verified == false` attempting to create an article in `/articles/art-1`.
2. **Shadow Field Injection on Article Create**: Admin or user sending `{"id": "art-1", ..., "isSuperSecret": true}` to `/articles/art-1`.
3. **ID Poisoning on Article**: Creating `/articles/invalid id with spaces!` or 2KB ID string.
4. **Unauthenticated Article Mutation**: Anonymous user attempting `update` or `delete` on `/articles/art-showcase-1`.
5. **Oversized Title / Denial of Wallet**: Sending a 10,000-character `title` to `/articles/art-1`.
6. **Unauthorized Site Settings Tampering**: Non-admin authenticated user attempting to update `/site_settings/main`.
7. **PII Leak on Contact Messages (`get`)**: Authenticated non-admin user attempting `get` on `/contact_messages/msg-1`.
8. **PII Leak on Contact Messages (`list`)**: Authenticated non-admin user attempting `list` on `/contact_messages`.
9. **Contact Message Pre-Marked as Read**: Visitor creating `/contact_messages/msg-1` with `"read": true` or extra ghost keys.
10. **Analytics Arbitrary Deletion**: Non-admin user attempting `delete` on `/site_analytics/main`.
11. **Analytics Negative Counter Poisoning**: Visitor updating `/site_analytics/main` with `totalSiteVisits: -500` or string value `"hacked"`.
12. **Self-Privilege Escalation in `/admins`**: Non-admin user attempting to create `/admins/{theirUid}` with `role: 'admin'`.
