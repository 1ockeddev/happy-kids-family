# Vercel Deployment Notes

**Date:** June 19, 2026  
**Next.js Version:** 16.2.6

---

## 🐛 Issue Fixed: Dynamic Route Params

### Problem
```
Type error: Type 'typeof import(".../[groupId]/events/route")' 
does not satisfy the constraint 'RouteHandlerConfig'
```

### Root Cause
Next.js 15+ เปลี่ยน `params` จาก **object** เป็น **Promise** ใน dynamic routes

### Solution Applied ✅

**Before (Local works, Vercel fails):**
```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const { groupId } = params; // ❌ Error on Vercel
  // ...
}
```

**After (Works everywhere):**
```typescript
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await context.params; // ✅ Correct
  // ...
}
```

### Files Fixed ✅

1. ✅ `app/api/line/groups/[groupId]/events/route.ts`
2. ✅ `app/api/line/groups/[groupId]/members/route.ts`

---

## 📋 Deployment Checklist

### Before Deploy

- [x] Code builds locally: `npm run build`
- [x] Fix dynamic route params
- [x] Environment variables ready
- [x] Database migrations ready

### On Vercel

**Environment Variables:**
```env
DATABASE_URL=postgresql://...
LINE_CHANNEL_SECRET=xxx
LINE_CHANNEL_ACCESS_TOKEN=xxx
ADMIN_USERNAME=xxx
ADMIN_PASSWORD=xxx
GDRIVE_ACTIVITY_FOLDER_ID=xxx
GDRIVE_API_KEY=xxx
NEXT_PUBLIC_LIFF_ID=xxx (if using LIFF)
```

**Database Migrations:**
```bash
# Run on production database
psql $PROD_DATABASE_URL -f db/migrations/001_initial_schema.sql
psql $PROD_DATABASE_URL -f db/migrations/002_add_admin_roles.sql
psql $PROD_DATABASE_URL -f db/migrations/003_add_line_flex_templates.sql
psql $PROD_DATABASE_URL -f db/migrations/004_add_line_groups.sql
```

### After Deploy

**LINE Console Configuration:**
1. Go to https://developers.line.biz/console/
2. Update Webhook URL: `https://your-domain.vercel.app/api/webhook/line`
3. Enable "Use webhook"
4. Enable "Allow bot to join group chats"

**Test Endpoints:**
- ✅ `https://your-domain.vercel.app/api/webhook/line` (GET)
- ✅ `https://your-domain.vercel.app/admin/line-messages`
- ✅ `https://your-domain.vercel.app/admin/line-groups`

---

## 🔍 Common Vercel Issues

### Issue 1: Build Fails with Type Error
**Cause:** Dynamic route params must be awaited  
**Fix:** Use `await context.params` ✅ FIXED

### Issue 2: Database Connection
**Cause:** Wrong connection string or SSL config  
**Fix:** Use Supabase Pooler URL with SSL enabled

**Correct Format:**
```env
# Supabase Pooler (recommended for Vercel)
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-xxx.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Issue 3: Environment Variables Not Set
**Cause:** Forgot to add in Vercel dashboard  
**Fix:** Settings → Environment Variables → Add all required vars

### Issue 4: Webhook Not Working
**Cause:** URL not updated in LINE Console  
**Fix:** Update webhook URL to Vercel domain

---

## 🚀 Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Add LINE Groups feature and fix Vercel build"
git push origin main
```

### 2. Deploy on Vercel
```bash
# If using Vercel CLI
vercel --prod

# Or push to GitHub and auto-deploy
```

### 3. Set Environment Variables
In Vercel Dashboard:
- Settings → Environment Variables
- Add all required variables
- Redeploy if needed

### 4. Run Migrations
```bash
# Connect to production database
psql $PROD_DATABASE_URL

# Run migrations
\i db/migrations/003_add_line_flex_templates.sql
\i db/migrations/004_add_line_groups.sql
```

### 5. Update LINE Console
- Webhook URL → Your Vercel domain
- Test webhook

### 6. Test Everything
- Admin login
- LINE Messages page
- LINE Groups page
- Send test message to bot
- Invite bot to group

---

## 📊 Vercel Build Settings

**Framework Preset:** Next.js  
**Build Command:** `npm run build`  
**Output Directory:** `.next`  
**Install Command:** `npm install`  
**Node Version:** 20.x

---

## 🔐 Security Notes

### Environment Variables
- ✅ Never commit `.env.local` to git
- ✅ Use different credentials for production
- ✅ Rotate tokens regularly

### Database
- ✅ Use connection pooling (Supabase Pooler)
- ✅ Enable SSL for production
- ✅ Set max connections limit

### Webhook
- ✅ Always verify LINE signature
- ✅ Use HTTPS only
- ✅ Monitor for suspicious activity

---

## 📈 Performance Tips

### Database Connections
```typescript
// lib/db.ts already optimized
const maxConnections = isProduction 
  ? (usePooler ? 10 : 2)  // Less connections in production
  : 10;
```

### API Routes
- ✅ Use connection pooling
- ✅ Close connections properly
- ✅ Handle errors gracefully

### Caching
Consider adding caching for:
- Group lists
- Member lists
- Templates

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Check logs
vercel logs your-deployment-url

# Test locally first
npm run build
```

### Runtime Errors
```bash
# Check Vercel function logs
vercel logs --follow

# Check database connection
psql $DATABASE_URL -c "SELECT 1"
```

### Webhook Not Working
```bash
# Test webhook endpoint
curl https://your-domain.vercel.app/api/webhook/line
# Should return: {"status":"LINE Webhook OK"}

# Check LINE Console webhook logs
```

---

## ✅ Verification Steps

After deployment, verify:

### Admin Pages
- [ ] `/admin` - Dashboard loads
- [ ] `/admin/line-messages` - Loads without error
- [ ] `/admin/line-groups` - Loads without error
- [ ] Login works
- [ ] Can create templates
- [ ] Can view groups

### API Endpoints
- [ ] `GET /api/line/groups` - Returns data
- [ ] `GET /api/line/groups/[id]/members` - Works
- [ ] `GET /api/line/groups/[id]/events` - Works
- [ ] `GET /api/line/templates` - Returns templates
- [ ] `POST /api/line/send-flex` - Can send messages

### Webhook
- [ ] `GET /api/webhook/line` - Returns OK
- [ ] `POST /api/webhook/line` - Receives events
- [ ] Follow event works
- [ ] Message event works
- [ ] Group events work

### Database
- [ ] All tables exist
- [ ] Migrations completed
- [ ] Sample data present
- [ ] Queries work

---

## 📞 Support

### If Deployment Fails

1. **Check Build Logs:**
   - Vercel Dashboard → Deployments → Click failed deployment
   - Look for error messages

2. **Common Fixes:**
   - Clear Vercel cache: Settings → General → Clear Cache
   - Check Node version: Should be 20.x
   - Verify all env vars are set

3. **Test Locally:**
   ```bash
   npm run build
   npm start
   ```

4. **Check Dependencies:**
   ```bash
   npm install
   npm audit fix
   ```

---

## 🎯 Success Criteria

**Deployment is successful when:**
- ✅ Build completes without errors
- ✅ All pages load correctly
- ✅ Database connections work
- ✅ Webhook receives events
- ✅ Admin can create templates
- ✅ Bot can join groups
- ✅ No console errors

---

## 📚 Related Documentation

- [Vercel Next.js Deployment](https://vercel.com/docs/frameworks/nextjs)
- [Next.js Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

---

**Status:** ✅ Ready to Deploy

All issues fixed. Build should succeed on Vercel now! 🚀

---

*Last Updated: June 19, 2026*  
*Next.js: 16.2.6*  
*Node: 20.x*
