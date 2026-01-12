# Tallie - Restaurant Reservation API

Assessment Project for Tallie Backend Engineer Position

## Features

### Core Features

- ✅ **Restaurant & Table Management**
  - Create restaurants with operating hours and peak hour settings
  - Add tables with specific capacities
  - View restaurant details with available tables

- ✅ **Reservation System**
  - Create reservations with customer details
  - Automatic table assignment based on party size
  - Check table availability for specific time slots
  - Prevent double-booking with overlap detection
  - View all reservations by restaurant and date

- ✅ **Business Logic**
  - Operating hours validation
  - Table capacity matching
  - Peak hour duration limits
  - Available time slot calculation
  - Automatic waitlist when no tables available

### Bonus Features Implemented

- ✅ **Reservation Management** - Cancel and modify reservations
- ✅ **Peak Hours Handling** - Configurable duration limits during busy times
- ✅ **Waitlist Functionality** - Automatic waitlist when tables unavailable
- ✅ **Reservation Status** - Pending, confirmed, completed, cancelled states
- ✅ **Mock Confirmations** - Console logging for reservation confirmations

## Prerequisites

- Node.js >= 20
- PostgreSQL >= 14 (or Docker)
- Docker & Docker Compose (optional, for containerized setup)

## Installation

### Option 1: Local Setup

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd tallie
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Set up the database**

   ```bash
   # Generate migrations
   pnpm db:generate
   
   # Run migrations
   pnpm db:migrate
   
   # Or push schema directly (development only)
   pnpm db:push
   ```

5. **Build the application**

   ```bash
   pnpm build
   ```

### Option 2: Docker Setup

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd tallie
   ```

2. **Create .env file**

   ```bash
   cp .env.example .env
   # Docker Compose will handle the database connection
   ```

3. **Start with Docker Compose**

   ```bash
   docker-compose up -d
   ```

The application will be available at `http://localhost:3000`.

## Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/tallie_db

# Server Configuration
PORT=3000
NODE_ENV=development

# Redis Configuration (Optional - for future caching)
REDIS_URL=redis://localhost:6379
```

## 🚀 Running the Application

### Development Mode

```bash
pnpm dev
```

### Production Mode

```bash
pnpm build
pnpm start
```

### Database Management

```bash
# Generate migrations from schema
pnpm db:generate

# Run migrations
pnpm db:migrate

# Push schema directly (dev only)
pnpm db:push

# Open Drizzle Studio (Database GUI)
pnpm db:studio
```

## API Documentation

Base URL: `http://localhost:3000/api/v1`

### Health Check

```
GET /health
```

### Restaurant Endpoints

See [API_EXAMPLES.md](./API_EXAMPLES.md) for detailed usage examples.

**Common HTTP Status Codes:**

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `409` - Conflict (double-booking, etc.)
- `500` - Internal Server Error

## Testing

### Run All Tests

```bash
pnpm test
```

### Watch Mode (for development)

```bash
pnpm test:watch
```

### Test Structure

The test suite covers:

- ✅ Restaurant creation and validation
- ✅ Table management
- ✅ Reservation creation with business rules
- ✅ Double-booking prevention
- ✅ Operating hours validation
- ✅ Peak hour restrictions
- ✅ Capacity constraints
- ✅ Availability checking
- ✅ Reservation updates and cancellations


## Design Decisions

### Business Logic Choices

1. **Automatic Table Assignment**: When no specific table is requested, the system uses a best-fit algorithm (smallest table that fits party size) to optimize space utilization.

2. **Time Slot Overlap Detection**: Uses SQL queries to detect overlapping reservations efficiently, checking if:
   - New reservation starts during existing reservation
   - New reservation ends during existing reservation  
   - New reservation completely contains existing reservation

3. **Peak Hour Management**: Configurable peak hours with duration limits help manage turnover during busy periods.

4. **Waitlist System**: When no tables are available, customers are automatically added to a waitlist instead of being rejected outright.

5. **Status Flow**: Reservations follow a clear lifecycle:
   - `pending` → Initial state
   - `confirmed` → Accepted reservation
   - `completed` → After dining
   - `cancelled` → Cancelled by customer or restaurant

### Technology Choices

- **Drizzle ORM**: Chosen for its TypeScript-first approach, excellent type inference, and lightweight nature
- **Zod**: Provides runtime validation with automatic TypeScript type inference
- **Vitest**: Fast, modern testing framework with great TypeScript support
- **Express**: Simple, proven framework for REST APIs

## Known Limitations

1. **Time Zone Handling**: Currently assumes all times are in the same timezone. For production, should use proper timezone handling with libraries like `date-fns-tz`.

2. **Concurrent Reservations**: No distributed locking mechanism. In high-traffic scenarios, race conditions could occur. Would need Redis locks or database locks for production.

3. **No Authentication**: No user authentication or authorization. In production would need JWT/OAuth for secure access.

4. **Limited Waitlist Management**: Waitlist doesn't auto-assign when reservations are cancelled. Would need a background job processor.

5. **No Email/SMS Integration**: Confirmation notifications only log to console. Would integrate services like SendGrid, Twilio in production.

6. **Single Restaurant Focus**: While supports multiple restaurants, some features (like search across restaurants) aren't implemented.

7. **No Partial Updates**: Validation requires all fields in some cases where partial updates would be better.

## Possible Future Improvements

1. **Redis Caching**: Cache availability checks and popular queries
2. **Rate Limiting**: Prevent API abuse with rate limiting middleware
3. **Request Logging**: Add structured logging with Winston or Pino
4. **API Documentation**: Interactive docs with Swagger/OpenAPI
5. **Database Seeding**: Scripts for demo data
6. **Background Jobs**: Use Bull/BullMQ for:
   - Automated reservation reminders
   - Waitlist notifications
   - Expired reservation cleanup
7. **Locking Mechanism**: Implement distributed locks for reservation creation using Redis

## Sample Scenarios

### Scenario 1: Normal Reservation

```
Restaurant: 10 AM - 10 PM
Request: Table for 4 at 7 PM for 2 hours
Result: ✅ Reservation confirmed (table assigned automatically)
```

### Scenario 2: Double-Booking Prevention

```
Existing: Table 5, 7 PM - 9 PM
Request: Table 5, 8 PM - 10 PM
Result: ❌ Error - Table not available (overlap detected)
```

### Scenario 3: Capacity Mismatch

```
Request: Party of 6, Table with capacity 4
Result: ❌ Error - Insufficient capacity
Alternative: System suggests table with capacity 6
```

### Scenario 4: Peak Hour Restriction

```
Restaurant: Peak hours 6 PM - 9 PM (max 90 min)
Request: 7 PM reservation for 150 minutes
Result: ❌ Error - Exceeds peak hour limit
```

### Scenario 5: Waitlist

```
Request: Party of 4 at 7 PM
All Suitable Tables: Booked
Result: ✅ Added to waitlist (position: 3)
```
