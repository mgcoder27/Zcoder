# ZCoder

ZCoder helps you collect coding problems from multiple platforms, organize them by topic, and track your solving progress.

**Live deployment:** [dezcoder.vercel.app](https://dezcoder.vercel.app/)

## Features

- Create an account, sign in, and manage a profile with coding-platform handles.
- Add problem links and solutions, and bookmark problems for later.
- Categorize questions by topic and difficulty.
- Track each bookmarked question as unsolved, in progress, or solved.
- Filter bookmarks by topic, difficulty, platform, and progress status, or search titles.
- Recognize supported problem platforms from their URLs: LeetCode, Codeforces, HackerRank, CodeChef, AtCoder, and GeeksforGeeks.

## Tech stack

- **Frontend:** React, Vite, and Tailwind CSS
- **Backend:** Node.js, Express, and Mongoose
- **Database:** MongoDB
- **Authentication support:** `express-session`; passwords are hashed with `bcryptjs`
- **Backend tests:** Jest

## Requirements

- Node.js and npm
- A MongoDB database and connection URI

## Configuration

Create the backend environment file from its example:

```sh
cd ZCoder/Backend
cp .env.example .env
```

Set `Mongo_url` in `Backend/.env`. Do not commit `.env`; the committed example contains placeholders only.

For the frontend, create a local environment file from the frontend example:

```sh
cd ZCoder
cp .env.example .env
```

`VITE_API_URL` optionally configures the backend base URL. It defaults to `http://localhost:5000` during local development and to the deployed Render API in production.

## Deploy to Render

The React frontend is hosted separately from the Express API. The Render service hosts the API at `https://zcoder-efnp.onrender.com`.

To connect or redeploy the backend service in Render:

1. Use the repository containing `ZCoder/Backend` and set its root directory to `ZCoder/Backend`.
2. Set the build command to `npm ci` and the start command to `node main.js`.
3. Set `Mongo_url` to the MongoDB connection URI and set `FRONTEND_URL` to the deployed frontend origin if it differs from `https://dezcoder.vercel.app`.
4. Deploy the service. The server listens on Render's assigned `PORT` (or port `5000` locally).

Render's default filesystem is ephemeral, so profile-image uploads stored in `Backend/views/uploads` are not durable across deploys or restarts; use persistent storage or object storage if uploads must be retained.

## Run locally

In one terminal, install and start the backend:

```sh
cd ZCoder/Backend
npm ci
node main.js
```

In another terminal, install and start the Vite development server:

```sh
cd ZCoder
npm ci
npm run dev
```

The frontend development server is available at `http://localhost:5173`.

To create a frontend production build:

```sh
cd ZCoder
npm run build
```

## Run backend tests

```sh
cd ZCoder/Backend
npm ci
npm test
```

The Jest suite covers platform detection, question filters, and progress-status validation.

## Contributing

1. Fork the repository and create a branch for your change.
2. Make and test your changes.
3. Push the branch and open a pull request.

Continuous integration runs the backend tests and frontend production build on pushes and pull requests.
