# Wenbun Server

This is the backend server for the Wenbun project.

## Prerequisites

- Docker
- Docker Compose

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
    docker-compose up -d --build
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
