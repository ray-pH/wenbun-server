# Wenbun Server

This is the backend server for the Wenbun project.

## Prerequisites

- Docker

## Getting Started

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd wenbun-server
    ```

2.  **Create a `.env` file:**

    Copy the `.env.example` file to `.env` and add your credentials.

    ```bash
    cp .env.example .env
    ```

3.  **Run with Docker Compose:**

    ```bash
    docker compose up -d --build
    ```

    The server will be running on `http://localhost:3000`.

## Local Development (Optional)

If you prefer to run the server locally without Docker, follow these steps:

1.  **Install dependencies:**

    ```bash
    npm install
    ```

2.  **Set up PostgreSQL:**

    Make sure you have a local PostgreSQL instance running.

3.  **Set environment variables:**

    Copy the `.env.example` file to `.env` and add your credentials.

    ```bash
    cp .env.example .env
    ```

4.  **Run the server:**

    ```bash
    npm run dev
    ```

## Database Backup and Restore

The database is PostgreSQL. You can use the `pg_dump` and `psql` command-line tools to back up and restore your data.

### Local (Docker)

These commands should be run from your project's root directory.

**To Create a Backup:**

This command dumps the database contents into a `backup.sql` file.

```bash
docker compose exec -T db pg_dump -U user -d mydb > backup.sql
```

**To Restore from a Backup:**

This command restores the database from the `backup.sql` file.

```bash
cat backup.sql | docker compose exec -T db psql -U user -d mydb
```

### Deployed (e.g., on Railway)

For a deployed database on a service like Railway, you have two main options:

1.  **Use the Dashboard:** Most cloud providers, including Railway, offer a web dashboard where you can perform manual backups or configure automatic backup schedules. This is the recommended approach.

2.  **Use Remote Tools:** You can use `pg_dump` and `psql` to connect to your remote database. You will need to get the database connection URL from your provider's dashboard.

    **To Create a Backup:**

    Replace `"YOUR_DATABASE_URL"` with the actual connection string.

    ```bash
    pg_dump "YOUR_DATABASE_URL" > backup.sql
    ```

    **To Restore from a Backup:**

    ```bash
    psql "YOUR_DATABASE_URL" < backup.sql
    ```