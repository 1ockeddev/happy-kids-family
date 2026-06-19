# 🚀 Quick Start: LINE Flex Messages

**Status:** ✅ Ready to use  
**Time to Test:** 5 minutes

---

## 1️⃣ Start the Server (30 seconds)

```bash
npm run dev
```

Wait for: **Ready on http://localhost:3000**

---

## 2️⃣ Open Admin Page (30 seconds)

1. Open browser: http://localhost:3000/admin/line-messages
2. Login:
   - Username: `a`
   - Password: `a`

---

## 3️⃣ Check Templates Tab (1 minute)

Should see:
- ✅ 1 template: "Welcome Message"
- ✅ Created date
- ✅ Use (📤) and Delete (🗑️) buttons

---

## 4️⃣ Create Test Template (2 minutes)

1. Fill form:
   - Name: `Test Message`
   - Description: `My first template`
   - JSON:
   ```json
   {
     "type": "bubble",
     "body": {
       "type": "box",
       "layout": "vertical",
       "contents": [
         {
           "type": "text",
           "text": "Hello!",
           "weight": "bold",
           "size": "xl"
         }
       ]
     }
   }
   ```

2. Click **บันทึก Template**

3. Should see: ✅ Success message + new template in list

---

## 5️⃣ Try Send Tab (1 minute)

1. Click **ส่งข้อความ** tab
2. See:
   - LINE User ID input
   - Template dropdown (2 templates)
   - Custom JSON textarea
   - Send button

**Note:** ⚠️ Don't send without a real User ID

---

## 6️⃣ Check Webhook Info Tab (30 seconds)

1. Click **Webhook Info** tab
2. See:
   - Webhook URL
   - Environment variables list
   - Events supported
   - Links to LINE docs

---

## ✅ Success!

If all steps work, you're ready to:
- 📤 Send flex messages to real users
- 📋 Manage unlimited templates
- 🔗 Configure production webhook

---

## 🎯 Next Steps

### To Send Real Messages:

1. **Get User ID:**
   - Ask user to message your LINE OA
   - Check webhook logs for their User ID
   - Format: `U1234567890abcdef...`

2. **Send Test:**
   - Paste User ID
   - Select template
   - Click send
   - Check LINE app

### For Production:

1. **Run Migration:**
   ```bash
   psql $PROD_DATABASE_URL -f db/migrations/003_add_line_flex_templates.sql
   ```

2. **Set Webhook:**
   - LINE Console → Messaging API
   - Webhook URL: `https://your-domain.com/api/webhook/line`
   - Enable webhook

3. **Test:**
   - Add your OA as friend
   - Send "activity" → Should get image
   - Send flex message → Should receive

---

## 📚 Need Help?

- **User Guide:** `LINE_MESSAGES_GUIDE.md`
- **Testing:** `LINE_MESSAGES_TESTING_CHECKLIST.md`
- **Technical:** `LINE_MESSAGES_IMPLEMENTATION_SUMMARY.md`
- **Overview:** `TASK_SUMMARY.md`

---

## 🛠️ Troubleshooting

**Templates don't show:**
```bash
# Check database
export DATABASE_URL="postgresql://postgres:0000@localhost:5432/school_attendance"
psql "$DATABASE_URL" -c "SELECT * FROM line_flex_templates;"
```

**Can't access page:**
- Check dev server is running
- Try: http://localhost:3000/admin/line-messages
- Check console for errors

**JSON error:**
- Use Flex Simulator: https://developers.line.biz/flex-simulator/
- Validate JSON format
- Check for missing commas/brackets

---

**Happy messaging!** 📱✨

Time elapsed: ~5 minutes ⏱️
