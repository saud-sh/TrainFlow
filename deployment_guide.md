# Deployment Guide: Free Hosting

This guide outlines how to deploy **TrainFlow** for free using **Neon** for the database and **Render** for the application hosting.

## 1. Database Setup (Neon)

Neon provides a persistent free tier for PostgreSQL.

1.  Go to [Neon.tech](https://neon.tech) and create an account.
2.  Create a new project named `TrainFlow`.
3.  Copy the **Connection String** (it should look like `postgresql://user:password@host/dbname?sslmode=require`).
4.  Keep this string handy; you will need it for the `DATABASE_URL` environment variable.

## 2. Prepare the Code

Ensure your code is pushed to a GitHub repository. Render will deploy directly from your repo.

## 3. Application Setup (Render)

Render will host both your backend server and your frontend.

1.  Go to [Render.com](https://render.com) and sign in with GitHub.
2.  Click **New +** and select **Web Service**.
3.  Connect your GitHub repository.
4.  Configure the service:
    - **Name**: `train-flow` (or any unique name)
    - **Environment**: `Node`
    - **Region**: Select the one closest to you.
    - **Branch**: `main`
    - **Build Command**: `npm install && npm run build`
    - **Start Command**: `npm start`
5.  Select the **Free** instance type.

## 4. Environment Variables

In the Render dashboard for your service, go to **Environment** and add the following variables:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations. |
| `DATABASE_URL` | *Your Neon Connection String* | The string you copied in step 1. |
| `SESSION_SECRET` | *A random long string* | Used to sign session cookies. |
| `OPENAI_API_KEY` | *Your OpenAI Key* | (Optional) If you use AI features. |

## 5. Deployment

1.  Click **Create Web Service**.
2.  Render will pull your code, install dependencies, run the build script, and start the server.
3.  Your app will be live at `https://train-flow.onrender.com` (or your chosen name).

> [!NOTE]
> On the Render Free tier, the server will "spin down" after 15 minutes of inactivity. The first request after a spin-down will take about 30-60 seconds to wake the server up.

## Summary of Commands
If you want to test the production build locally before deploying:
```bash
npm run build
npm start
```
This will compile the frontend into `dist/public` and the backend into `dist/index.cjs`, then run the production bundle.
