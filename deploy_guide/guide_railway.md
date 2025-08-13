# Deploying to Railway

Here are the general steps to deploy your application to Railway. This guide assumes you have a Railway account and have your code pushed to a GitHub repository.

### Step 1: Create a New Project on Railway

1.  Go to your Railway dashboard and click "New Project".
2.  Select "Deploy from GitHub repo".
3.  Choose the GitHub repository for your `wenbun-server` application.

Railway will automatically detect the `Dockerfile` in your repository and configure a new service.

### Step 2: Add a Database

Your application needs a PostgreSQL database.

1.  In your Railway project, click "New" or the "+" button.
2.  Select "Database" and then choose "PostgreSQL".
3.  Railway will provision a new PostgreSQL database for you.

### Step 3: Configure Environment Variables

This is the most important part. You need to provide Railway with the same environment variables you have in your `docker-compose.yml` file.

1.  Go to your `server` service in the Railway project.
2.  Click on the "Variables" tab.
3.  Add the following environment variables:

    *   `DATABASE_URL`: Railway automatically provides a `DATABASE_URL` variable when you add a PostgreSQL database. You should use this variable. It will look something like `postgresql://user:password@host:port/database`.
    *   `GOOGLE_CLIENT_ID`: You need to get this from your Google Cloud Console for Google OAuth.
    *   `GOOGLE_CLIENT_SECRET`: You also get this from the Google Cloud Console.
    *   `SESSION_SECRET`: This should be a long, random string that you generate yourself. It's used to secure user sessions.
    *   `NODE_ENV`: Set this to `production`. This is important because your code has specific logic for the production environment (like the CORS and cookie settings).
    *   `CLIENT_URL`: The URL of your front-end application. This is used for CORS and for redirecting after OAuth.
    *   `PORT`: Railway sets this automatically, so you don't need to set it yourself. Your `index.ts` file already correctly uses `process.env.PORT`.

### Step 4: Deployment

Once you've configured the environment variables, Railway will automatically trigger a new deployment. It will:

1.  Build a Docker image from your `Dockerfile`.
2.  Run the container with the `CMD` specified in your `Dockerfile` (`node dist/index.js`).
3.  Expose the service on the port specified by the `PORT` environment variable.

You can monitor the deployment logs in the "Deployments" tab of your service.

### Summary of what you need to fill in:

*   **GitHub Repository:** Connect your `wenbun-server` repository to Railway.
*   **Database:** Add a PostgreSQL database service.
*   **Environment Variables in Railway:**
    *   `DATABASE_URL` (use the one provided by Railway)
    *   `GOOGLE_CLIENT_ID`
    *   `GOOGLE_CLIENT_SECRET`
    *   `SESSION_SECRET`
    *   `NODE_ENV` (set to `production`)
    *   `CLIENT_URL`

That's it! Railway is designed to make this process as seamless as possible by leveraging the `Dockerfile` in your project.
