# LINE Messages Testing Checklist

## ✅ Pre-Testing Setup (Done)

- [x] Database migration ran successfully
- [x] Table `line_flex_templates` created
- [x] Sample template exists in database
- [x] All API routes created
- [x] Frontend admin page created
- [x] Navigation menu added to sidebar
- [x] Environment variables configured

---

## 🧪 Testing Steps

### 1. Start Dev Server

```bash
npm run dev
```

**Expected:** Server starts at http://localhost:3000

---

### 2. Test Admin Page Access

**Steps:**
1. Open browser
2. Go to http://localhost:3000/admin
3. Login with admin credentials
4. Click "LINE Messages" in sidebar

**Expected Results:**
- ✅ Menu item "LINE Messages" visible in "การสื่อสาร" section
- ✅ Page loads at `/admin/line-messages`
- ✅ See 3 tabs: ส่งข้อความ, Templates, Webhook Info
- ✅ No console errors

---

### 3. Test Templates Tab

**Steps:**
1. Click "Templates" tab
2. Verify "Welcome Message" template appears
3. Try creating a new template:
   - Name: "Test Template"
   - Description: "ทดสอบ"
   - JSON: Use simple bubble from Flex Simulator
4. Click "บันทึก Template"

**Test JSON:**
```json
{
  "type": "bubble",
  "body": {
    "type": "box",
    "layout": "vertical",
    "contents": [
      {
        "type": "text",
        "text": "ทดสอบ",
        "weight": "bold",
        "size": "xl"
      }
    ]
  }
}
```

**Expected Results:**
- ✅ Welcome Message template visible
- ✅ Can create new template
- ✅ Success message appears
- ✅ New template appears in list
- ✅ Can click 📤 to use template
- ✅ Can delete template with 🗑️

---

### 4. Test Send Message Tab (Without Actual Send)

**Steps:**
1. Click "ส่งข้อความ" tab
2. Verify template dropdown shows templates
3. Select a template
4. Try pasting custom JSON
5. Check that "ส่งข้อความ" button enables

**Expected Results:**
- ✅ Template dropdown populated
- ✅ Custom JSON textarea works
- ✅ Button disabled without User ID
- ✅ Link to Flex Simulator works

**Note:** ⚠️ Don't actually send without a valid User ID

---

### 5. Test Webhook Info Tab

**Steps:**
1. Click "Webhook Info" tab
2. Verify information displayed

**Expected Results:**
- ✅ Webhook URL shown correctly
- ✅ Environment variables listed
- ✅ Events list displayed
- ✅ Links to LINE resources work

---

### 6. Test API Endpoints (via Browser DevTools or curl)

#### Test GET templates
```bash
curl http://localhost:3000/api/line/templates
```

**Expected:**
```json
{
  "templates": [
    {
      "id": "...",
      "name": "Welcome Message",
      "description": "...",
      "template": {...},
      "created_at": "..."
    }
  ]
}
```

#### Test POST template
```bash
curl -X POST http://localhost:3000/api/line/templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test",
    "description": "Created via API",
    "template": {
      "type": "bubble",
      "body": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          {
            "type": "text",
            "text": "Test"
          }
        ]
      }
    }
  }'
```

**Expected:**
```json
{
  "template": {
    "id": "...",
    "name": "API Test",
    ...
  }
}
```

---

### 7. Test Webhook (Optional - Requires LINE Setup)

**Prerequisites:**
- LINE Official Account created
- ngrok or similar for local testing
- Webhook URL configured in LINE Console

**Steps:**
1. Start ngrok: `ngrok http 3000`
2. Copy ngrok URL
3. Set webhook in LINE Console: `https://xxx.ngrok.io/api/webhook/line`
4. Send message to LINE OA

**Expected:**
- ✅ Webhook receives events
- ✅ Follow event creates user in database
- ✅ Message "activity" returns image from Google Drive
- ✅ Unfollow updates user status

---

### 8. Test Actual Flex Message Send (Requires Real User ID)

**Prerequisites:**
- Valid LINE User ID
- User has added your LINE OA as friend

**Steps:**
1. Get User ID from webhook logs or LIFF app
2. Go to "ส่งข้อความ" tab
3. Enter User ID
4. Select template or paste JSON
5. Click "ส่งข้อความ"
6. Check LINE app on phone

**Expected:**
- ✅ Success message in admin UI
- ✅ Flex message appears in LINE chat
- ✅ Message displays correctly

---

## 🐛 Common Issues and Solutions

### Issue: Page 404 Not Found
**Solution:** 
- Verify dev server is running
- Check file path: `app/admin/line-messages/page.tsx` exists
- Try hard refresh (Cmd+Shift+R)

### Issue: Templates don't load
**Solution:**
- Check database connection
- Verify migration ran: `SELECT * FROM line_flex_templates;`
- Check browser console for API errors

### Issue: Can't send flex message
**Solution:**
- Verify `LINE_CHANNEL_ACCESS_TOKEN` in .env.local
- Check User ID format (starts with U)
- Validate JSON in Flex Simulator first
- Check network tab for API response

### Issue: Webhook not working
**Solution:**
- Verify `LINE_CHANNEL_SECRET` in .env.local
- Check webhook URL in LINE Console
- Ensure HTTPS (use ngrok for local)
- Check signature verification

---

## 📊 Database Verification

### Check table exists:
```sql
\d line_flex_templates
```

### Count templates:
```sql
SELECT COUNT(*) FROM line_flex_templates;
```

### View all templates:
```sql
SELECT id, name, description, created_at 
FROM line_flex_templates 
ORDER BY created_at DESC;
```

### View template JSON:
```sql
SELECT name, template 
FROM line_flex_templates 
WHERE name = 'Welcome Message';
```

---

## ✅ Success Criteria

**All these should work:**
- [ ] Can access `/admin/line-messages`
- [ ] Can view existing templates
- [ ] Can create new template
- [ ] Can delete template
- [ ] Can select template for sending
- [ ] Templates persist after page refresh
- [ ] API endpoints return correct data
- [ ] No console errors
- [ ] Responsive on mobile
- [ ] Webhook Info tab displays correctly

**Optional (Requires LINE setup):**
- [ ] Can actually send flex message to real user
- [ ] Webhook receives and processes events
- [ ] Follow event creates user
- [ ] Activity keyword returns image

---

## 🎯 Next Steps After Testing

1. **If all tests pass:**
   - Document any User IDs for testing
   - Prepare for production deployment
   - Update webhook URL in LINE Console for production

2. **If issues found:**
   - Check console logs
   - Verify database connection
   - Check environment variables
   - Review API error responses

3. **For production:**
   - Change admin credentials
   - Use production database
   - Configure production webhook URL
   - Test with real users

---

## 📝 Test Log Template

Copy and fill this out while testing:

```
Date: ___________
Tester: ___________

[ ] Dev server starts
[ ] Admin page loads
[ ] Templates tab works
[ ] Can create template
[ ] Can delete template
[ ] Send tab loads correctly
[ ] Webhook info displays
[ ] API endpoints work
[ ] No console errors

Issues found:
1. 
2. 
3. 

Notes:


```

---

**Happy Testing!** 🧪✨

If everything works, you're ready to use LINE Flex Messages! 📱🎉
