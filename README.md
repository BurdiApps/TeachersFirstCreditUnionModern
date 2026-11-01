# Teachers First Credit Union Modern

A responsive learning project that modernizes the fictional Teachers First legacy site with React, ASP.NET Core, EF Core, and SQL Server. All balances, rates, members, and transactions are fictional.

## Stack and request flow

- **React + TypeScript + Tailwind CSS** render the public site, sign-in form, and member dashboard.
- **ASP.NET Core minimal API** validates requests and returns JSON.
- **ASP.NET Core Identity** hashes passwords and verifies them during login; the application never stores raw passwords.
- **EF Core** translates C# queries into SQL and applies versioned database migrations.
- **SQL Server or Azure SQL** persist users, accounts, and transactions.

For example, the dashboard calls `GET /api/accounts`. The API reads the member ID from the signed-in cookie, filters the EF Core query to that member, and returns JSON. React then renders the result. The browser stores the authentication cookie as `HttpOnly`; JavaScript does not read or save it.

## Run the public site for screenshots

Open a terminal in the project folder and run:

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1
```

Open **http://localhost:5173**. The public homepage works without a database. You can resize the browser to capture desktop and mobile layouts.

## Run login and the dashboard locally

The login, registration, and dashboard need SQL Server. The commands below use Docker Desktop to run a local SQL Server container. On Apple Silicon, this SQL Server image runs as x64 emulation and may be slower.

### 1. Start SQL Server

In the project root:

```bash
cp .env.example .env
```

Edit `.env` and replace the example password with a private password. Do not commit `.env`. Then start the database:

```bash
docker compose up -d
```

### 2. Give the API a database connection

Still in the project root, save the connection string in .NET user-secrets. Replace `YOUR_LOCAL_PASSWORD` with the password you put in `.env`:

```bash
dotnet user-secrets --project backend/CreditUnion.Api init
dotnet user-secrets --project backend/CreditUnion.Api set "ConnectionStrings:TeachersFirst" "Server=localhost,1433;Database=TeachersFirst;User Id=sa;Password=YOUR_LOCAL_PASSWORD;Encrypt=True;TrustServerCertificate=True"
```

User-secrets stores this development-only setting outside the repository. Never put a database password in `appsettings.json` or commit it to GitHub.

### 3. Create database tables

EF Core migrations create the Identity, account, and transaction tables in SQL Server:

```bash
dotnet ef database update --project backend/CreditUnion.Api
```

Migrations are versioned in [backend/CreditUnion.Api/Data/Migrations](./backend/CreditUnion.Api/Data/Migrations). After changing an EF entity or its mapping, create a new migration with:

```bash
dotnet ef migrations add DescribeYourChange --project backend/CreditUnion.Api
dotnet ef database update --project backend/CreditUnion.Api
```

### 4. Start the API and React app

Use two terminals from the project root:

```bash
dotnet run --project backend/CreditUnion.Api
```

```bash
cd frontend
npm run dev -- --host 127.0.0.1
```

Visit **http://localhost:5173**. Vite forwards `/api` requests to ASP.NET Core on **http://localhost:5080**, so the browser can use the secure cookie without a separate frontend API URL.

### 5. Try the demo account data

Use **Join us** to create a login with the email `alex.morgan@teachersfirst.local` and a password that meets the form's requirements. Registration creates the user, but does not automatically create banking accounts.

To see fictional accounts in the dashboard, open [database/sample-data.sql](./database/sample-data.sql) in a SQL client connected to the local `TeachersFirst` database and execute it once. It links the sample accounts to that email. The script does not create or set a password.

Stop the local database with `docker compose down`. The named Docker volume keeps its data. **Do not** use `docker compose down -v` unless you intend to delete that local database.

## Set up Azure SQL

1. In the Azure Portal, create an **Azure SQL logical server** and an **Azure SQL Database**. The Basic tier is suitable only for trying this sample; choose a tier appropriate to your workload for real applications.
2. In the SQL server's networking settings, allow your current IP for local development. Avoid broad public firewall rules.
3. Use the Query Editor or a SQL client to connect to the new database. Run `dotnet ef database update` from your computer against Azure SQL; this creates the tables. The optional sample-data script can be run afterward.
4. Configure the API's connection string as an environment secret named `ConnectionStrings__TeachersFirst`. Example shape:

   ```text
   Server=tcp:YOUR_SERVER.database.windows.net,1433;Initial Catalog=TeachersFirst;Persist Security Info=False;User ID=YOUR_APP_LOGIN;Password=YOUR_SECRET;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30
   ```

   Use an application-specific, least-privilege database login—not the Azure server administrator—for a deployed app. For production on Azure, prefer a managed identity and Azure SQL Entra authentication over a stored SQL password.
5. If the frontend and API are deployed on different origins, set `Cors__AllowedOrigins__0` to the exact frontend origin, such as `https://your-site.example.com`, and set `Auth__CookieSameSite=None`. Cross-origin cookies require HTTPS. Hosting the frontend and API under the same site origin is simpler.

For local development against Azure SQL, set the connection string as a user secret instead of putting it in the source files:

```bash
dotnet user-secrets --project backend/CreditUnion.Api set "ConnectionStrings:TeachersFirst" "PASTE_YOUR_AZURE_SQL_CONNECTION_STRING"
dotnet ef database update --project backend/CreditUnion.Api
```

## Authentication and safety notes

- Identity uses its built-in salted password hasher. Login cookies are `HttpOnly`, time-limited, and protected by antiforgery tokens on state-changing requests.
- Passwords must be at least 12 characters with uppercase, lowercase, and a number. Five failed login attempts trigger a temporary lockout.
- The member API requires a login and filters results by the current member ID. One member cannot request another member's accounts by changing a URL.
- This learning sample does not include verified email, MFA, member identity checks, password reset, real credit-union integration, transfers, or production fraud controls. **Do not use it to store real member or financial data.**
- The assistant is a deterministic demo, not a generative AI service. Do not enter personal or account information.

## Useful routes

- `GET /health`
- `GET /api/auth/csrf`
- `GET /api/auth/me`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/accounts` (signed in)
- `GET /api/accounts/{id}/transactions` (signed in)
- `POST /api/assistant`

## Build checks

```bash
cd frontend && npm ci && npm run build
dotnet build backend/CreditUnion.Api --configuration Release
```

GitHub Actions runs these frontend and API build checks for pushes and pull requests to `main`.
