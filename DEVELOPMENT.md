# 

This guide will help you get the Restaurant Reservation System up and running quickly.

## Prerequisites Check

```bash
node --version  # Should be >= 20
pnpm --version  # Should be >= 8
docker --version  # Optional, for Docker setup
```

## Option 1: Quick Start with Docker (Recommended)

This is the fastest way to get started with everything pre-configured.

### 1. Create environment file

```bash
cp .env.example .env
```

### 2. Start everything with Docker Compose

```bash
docker-compose up -d
```

### 3. Wait for services to be healthy (about 30 seconds)

```bash
docker-compose ps
```

### 4. Push database schema

```bash
# Run migrations inside the container
docker-compose exec api pnpm db:push
```

### 5. (Optional) Seed with demo data

```bash
docker-compose exec api pnpm db:seed
```

### 6. Test the API

```bash
curl http://localhost:3000/health
```

**That's it! 🎉 Your API is running at <http://localhost:3000>**

---

## Option 2: Local Development Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up PostgreSQL

#### Using Docker for database only

```bash
docker run -d \
  --name tallie-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=tallie_dev \
  -p 5432:5432 \
  postgres:18-alpine
```

#### Or install PostgreSQL locally

- Mac: `brew install postgresql`
- Ubuntu: `sudo apt-get install postgresql`
- Windows: Download from postgresql.org

### 3. Create .env file

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DATABASE_URL=postgresql://tallie:tallie_password@localhost:5432/tallie_db
PORT=3000
NODE_ENV=development
```

### 4. Set up database schema

```bash
# Generate migrations (if using migrations)
pnpm db:generate

# Or push schema directly (faster for development)
pnpm db:push
```

### 5. (Optional) Seed with demo data

```bash
pnpm db:seed
```

### 6. Build the application

```bash
pnpm build
```

### 7. Start the server

```bash
# Development mode with auto-reload
pnpm dev

# Or production mode
pnpm start
```

### 8. Verify it's running

```bash
curl http://localhost:3000/health
```

---

## Quick API Test

### 1. Create a restaurant

```bash
curl -X POST http://localhost:3000/api/restaurants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Restaurant",
    "openingTime": "10:00:00",
    "closingTime": "22:00:00"
  }'
```

### 2. Add a table

```bash
curl -X POST http://localhost:3000/api/restaurants/1/tables \
  -H "Content-Type: application/json" \
  -d '{
    "tableNumber": "T1",
    "capacity": 4
  }'
```

### 3. Create a reservation

```bash
# Replace the date with tomorrow's date
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": 1,
    "customerName": "John Doe",
    "customerPhone": "+1234567890",
    "partySize": 4,
    "reservationDate": "2024-01-20T19:00:00.000Z",
    "duration": 120
  }'
```

---

## Development Tools

### Database GUI

```bash
pnpm db:studio
# Opens Drizzle Studio at http://localhost:4983
```

### Run Tests

```bash
pnpm test
```

### Watch Mode (auto-run tests on change)

```bash
pnpm test:watch
```

---

## Troubleshooting

### Port 3000 already in use

```bash
# Change PORT in .env file
PORT=3001
```

### Database connection error

```bash
# Check if PostgreSQL is running
docker ps  # If using Docker
# or
pg_isready  # If using local PostgreSQL

# Verify DATABASE_URL in .env
echo $DATABASE_URL
```

### Can't connect to database in Docker

```bash
# Check logs
docker-compose logs api
docker-compose logs postgres

# Restart services
docker-compose restart
```

### TypeScript compilation errors

```bash
# Clean and rebuild
rm -rf dist/
pnpm build
```

### Migration issues

```bash
# Reset and push fresh schema
pnpm db:push
```

---

## Next Steps

1. **Read the API Documentation**: Check [API_EXAMPLES.md](./API_EXAMPLES.md) for detailed API usage
2. **Explore the Code**: Start with [src/app.ts](./src/app.ts)
3. **Run Tests**: `pnpm test` to see all test cases
4. **View Database**: `pnpm db:studio` to see data in GUI
5. **Read Full README**: [README.md](./README.md) for complete documentation

---

## Stopping the Application

### Docker setup

```bash
docker-compose down          # Stop containers
docker-compose down -v       # Stop and remove volumes (deletes data)
```

### Local setup

```bash
# Press Ctrl+C in the terminal running the server
# Stop PostgreSQL if running via Docker:
docker stop tallie-postgres
```

---

## Common Commands Reference

```bash
# Development
pnpm dev                    # Start dev server
pnpm build                  # Build TypeScript
pnpm start                  # Start production server

# Database
pnpm db:push                # Push schema to database
pnpm db:generate            # Generate migrations
pnpm db:migrate             # Run migrations
pnpm db:studio              # Open database GUI
pnpm db:seed                # Seed demo data

# Testing
pnpm test                   # Run all tests
pnpm test:watch             # Watch mode
pnpm test:coverage          # Coverage report

# Docker
docker-compose up -d        # Start all services
docker-compose down         # Stop all services
docker-compose logs api     # View API logs
docker-compose ps           # Check service status
```

---

**Need Help?** Check the full [README.md](./README.md) or open an issue on GitHub.
