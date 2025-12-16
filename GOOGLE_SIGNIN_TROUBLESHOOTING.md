# Google Sign-In Troubleshooting Guide

## Issue: Google Sign-In Button Not Appearing

**Solution:**
1. Check browser console (F12 → Console tab)
2. You should see: "Google Sign-In library not loaded" OR "User data stored successfully"
3. Make sure `<script src="https://accounts.google.com/gsi/client" async defer></script>` is in the head

## Issue: "Invalid Client ID" Error

**Steps to Fix:**
1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Go to APIs & Services → Credentials
3. Copy your full Client ID (looks like: `123456789-abcdef.apps.googleusercontent.com`)
4. Open `signup.html`
5. Find: `data-client_id="YOUR_GOOGLE_CLIENT_ID"`
6. Replace `YOUR_GOOGLE_CLIENT_ID` with your actual Client ID
7. Save the file and refresh the page

## Issue: "User hasn't verified origin" or "origin_mismatch" Error

**This means the domain where you're running the app isn't authorized.**

**To Fix:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: APIs & Services → OAuth 2.0 Client IDs → Your Web Client
3. Click **Edit**
4. Under **Authorized JavaScript origins**, add these domains:
   - `http://localhost:8000` (if using port 8000)
   - `http://localhost:3000` (if using port 3000)
   - `http://127.0.0.1:8000` (local IP)
   - `http://localhost` (without port, for default http)
5. If deploying to a real domain, add:
   - `https://yourdomain.com`
   - `https://www.yourdomain.com`
6. Click **Save**
7. Refresh the signup page (clear browser cache with Ctrl+F5)

## Issue: Google Sign-In Button Clicks But Nothing Happens

**Possible causes:**
1. JavaScript console errors (check F12 console)
2. Google library not fully loaded yet
3. Client ID not set correctly

**To Debug:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try clicking the Google button
4. Look for errors like:
   - `handleGoogleSignUp is not defined` → Script issue
   - `Cannot read property 'credential'` → Response parsing issue
   - Network errors → Check internet connection

## Issue: Success Prompt Shows But Account Info Is Wrong

**This means the OAuth callback is working, but the data might be incomplete.**

**Check localStorage:**
1. Open browser DevTools (F12)
2. Go to Application → LocalStorage
3. Look for entries like:
   - `os_current_user`
   - `os_user_email`
   - `os_user_fullname`
4. These should contain your real Google account info

**If empty, the callback didn't trigger properly:**
- Check console for error messages
- Make sure `handleGoogleSignUp` function exists in script
- Verify Client ID is correct

## Step-by-Step Testing

1. **Start local server:**
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Or npm http-server
   npx http-server -p 8000
   ```

2. **Navigate to:** `http://localhost:8000/signup.html`

3. **Open DevTools:** Press F12

4. **Go to Console tab** and watch for messages when you click the Google button

5. **Check these outputs:**
   - `Google Sign-In response received: {...}` ✅ Button working
   - `Decoded user data: {...}` ✅ User info decoded
   - `User data stored successfully` ✅ Account created
   - Any red errors ❌ Problem found

## Common Client ID Format

Your Client ID should look like:
```
123456789012-abcdefghijklmnop1234567890qwerty.apps.googleusercontent.com
```

If yours looks different, you might have copied the wrong value.

## Verify Your Setup (Checklist)

- [ ] Google Cloud Project created
- [ ] Google+ API enabled
- [ ] OAuth 2.0 Web Client created
- [ ] Client ID copied correctly
- [ ] Client ID added to `signup.html` (replacing `YOUR_GOOGLE_CLIENT_ID`)
- [ ] localhost or your domain in "Authorized JavaScript origins"
- [ ] Using `http://` (not `https://`) for local testing
- [ ] Browser console shows no errors
- [ ] Google Sign-In button is visible
- [ ] Can click the button and see Google sign-in popup
- [ ] Success message appears after selecting Google account

## Still Having Issues?

Check these resources:
- [Google Sign-In for Web Documentation](https://developers.google.com/identity/gsi/web)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

**Pro Tip:** Clear all browser cookies/cache (Ctrl+Shift+Delete) and refresh if you made changes to the Client ID or origins.
