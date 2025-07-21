# CPay Admin Automation & Integration

## Local Setup

1. **Clone the repo:**
   ```sh
   git clone https://github.com/besfeng23/cpay5.git
   cd cpay5
   git checkout cpayadmin
   ```

2. **Frontend Environment:**
   - Create a `.env` file in the root:
     ```env
     NEXT_PUBLIC_DISPATCHER_URL=https://asia-southeast1-applez-dch9v.cloudfunctions.net/cpayDispatcher
     ```

3. **Backend Environment:**
   - Create a `functions/.env` file:
     ```env
     OPENAI_API_KEY=your-openai-api-key-here
     ```
   - Or use Firebase secrets:
     ```sh
     firebase functions:secrets:set OPENAI_API_KEY
     ```

4. **Install dependencies:**
   ```sh
   npm install
   cd functions && npm install
   cd ../src && npm install || true
   cd ..
   ```

5. **Run locally:**
   - Backend: `cd functions && npm run serve`
   - Frontend: `cd src && npm run dev`

## CI/CD & Deployment

- All pushes to `cpayadmin` branch trigger GitHub Actions:
  - Run tests, build, and deploy backend (Firebase Functions) and frontend (Firebase Hosting).
  - Requires `FIREBASE_TOKEN` secret in GitHub Actions.

## Adding Secrets

- Get your Firebase token:
  ```sh
  firebase login:ci
  ```
- Add it to GitHub: Settings > Secrets and variables > Actions > New repository secret > `FIREBASE_TOKEN`

## Monitoring & Alerts

- Integrate Sentry, Firebase Crashlytics, or similar for error monitoring.
- Use GitHub Actions notifications for build/deploy status.

## Support

If you need to add more environment variables, secrets, or want to automate more flows, update the `.env` files and CI/CD workflow as needed.
