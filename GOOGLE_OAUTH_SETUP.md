# Google OAuth Sign-In Setup Guide

This guide will help you set up real Google Sign-In authentication for OffiStation's sign-up page.

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click on the **Select a Project** dropdown at the top
4. Click **New Project**
5. Enter project name: "OffiStation" (or your preferred name)
6. Click **Create**

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google+ API"
3. Click on **Google+ API**
4. Click the **Enable** button

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - Select **External** for User Type
   - Click **Create**
   - Fill in the app details:
     - App name: OffiStation
     - User support email: your-email@gmail.com
     - Developer contact: your-email@gmail.com
   - Click **Save and Continue**
   - Add your email under Test users
   - Click **Save and Continue** through remaining screens

4. After OAuth consent screen is configured, create the credentials:
   - **Application type**: Web application
   - **Name**: OffiStation Web Client
   - **Authorized JavaScript origins** (add these):
     - `http://localhost:3000`
     - `http://127.0.0.1:3000`
     - `http://localhost:8000`
     - `http://localhost` (if running locally without port)
     - Your actual website domain when deployed
   - **Authorized redirect URIs**: (usually not needed for web client, but if prompted, use the same URLs)
   - Click **Create**

5. You'll see a popup with your **Client ID** and **Client Secret**
   - Copy the **Client ID** (you don't need the secret for client-side only)

## Step 4: Configure OffiStation

1. Open `signup.html` in your editor
2. Find this line:
   ```html
   data-client_id="YOUR_GOOGLE_CLIENT_ID"
   ```
3. Replace `YOUR_GOOGLE_CLIENT_ID` with the Client ID you copied in Step 3
4. Save the file

Example:
```html
data-client_id="123456789-abcdef.apps.googleusercontent.com"
```

## Step 5: Test Locally

1. Run a local web server (if not already running):
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Or using Python 2
   python -m SimpleHTTPServer 8000
   ```

2. Open your browser to `http://localhost:8000/signup.html`
3. Click the **Sign Up with Google** button
4. Select your Google account
5. You should see the success prompt with your real Google account information!

## What Happens During Sign-In

When you click "Sign Up with Google":

1. Google's authentication popup appears
2. You sign in with your Google account
3. The app receives your:
   - Full name
   - Email address
   - Profile picture URL
   - Unique Google ID
4. All this information is stored in your browser's localStorage
5. Success prompt displays with your real Google account details

## Troubleshooting

### "Invalid Client ID" Error
- Make sure you copied the full Client ID correctly
- Check that your domain is added to the authorized JavaScript origins

### Google Sign-In Button Not Appearing
- Ensure the Google client library is loaded: `<script src="https://accounts.google.com/gsi/client" async defer></script>`
- Check browser console for errors (Press F12)
- Make sure JavaScript is enabled

### Test Users Only Mode
- If your OAuth consent screen is still in testing, only accounts added as test users can sign in
- Add your account to test users in the OAuth consent screen

### Deployed Website Issues
- When deploying to a real domain, add that domain to authorized JavaScript origins in Google Cloud Console
- Example: `https://myoffistation.com`

## Security Notes

This implementation stores user information in browser localStorage, which is suitable for demo/testing purposes. For production:

1. Never expose your Client Secret in frontend code
2. Implement proper backend authentication
3. Use secure session management
4. Never store sensitive user data in localStorage
5. Implement HTTPS-only authentication

## Support

For more details on Google Sign-In for Web, visit:
- [Google Sign-In Documentation](https://developers.google.com/identity/gsi/web)
- [Google Cloud Console](https://console.cloud.google.com/)
