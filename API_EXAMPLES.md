# API Examples

This document provides example API requests for testing the Restaurant Reservation System.

## Prerequisites

Make sure the server is running on `http://localhost:3000`

## 1. Create a Restaurant

```bash
curl -X POST http://localhost:3000/api/v1/restaurants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "The Gourmet Bistro",
    "openingTime": "10:00:00",
    "closingTime": "22:00:00",
    "peakHourStart": "18:00:00",
    "peakHourEnd": "21:00:00",
    "peakHourMaxDuration": 90
  }'
```

## 2. List All Restaurants

```bash
curl http://localhost:3000/api/v1/restaurants
```

## 3. Add Tables to Restaurant

Replace `{restaurantId}` with the actual ID from step 1.

```bash
# Table 1 - Capacity 2
curl -X POST http://localhost:3000/api/v1/restaurants/1/tables \
  -H "Content-Type: application/json" \
  -d '{
    "tableNumber": "T1",
    "capacity": 2
  }'

# Table 2 - Capacity 4
curl -X POST http://localhost:3000/api/v1/restaurants/1/tables \
  -H "Content-Type: application/json" \
  -d '{
    "tableNumber": "T2",
    "capacity": 4
  }'

# Table 3 - Capacity 6
curl -X POST http://localhost:3000/api/v1/restaurants/1/tables \
  -H "Content-Type: application/json" \
  -d '{
    "tableNumber": "T3",
    "capacity": 6
  }'
```

## 4. Get Restaurant Details

```bash
curl http://localhost:3000/api/v1/restaurants/1
```

## 5. Create a Reservation

```bash
curl -X POST http://localhost:3000/api/v1/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": 1,
    "customerName": "John Doe",
    "customerPhone": "+1234567890",
    "partySize": 4,
    "reservationDate": "2024-01-20T19:00:00.000Z",
    "duration": 120,
    "notes": "Window seat preferred"
  }'
```

## 6. Check Availability

```bash
curl "http://localhost:3000/api/v1/reservations/check-availability?restaurantId=1&date=2024-01-20T19:00:00.000Z&partySize=4&duration=120"
```

## 7. Get Available Time Slots

```bash
curl "http://localhost:3000/api/v1/reservations/available-slots?restaurantId=1&date=2024-01-20&partySize=4"
```

## 8. Get All Reservations for a Date

```bash
curl "http://localhost:3000/api/v1/reservations?restaurantId=1&date=2024-01-20"
```

## 9. Update a Reservation

Replace `{reservationId}` with actual reservation ID.

```bash
curl -X PATCH http://localhost:3000/api/v1/reservations/1 \
  -H "Content-Type: application/json" \
  -d '{
    "duration": 90,
    "notes": "Changed to bar seating"
  }'
```

## 10. Cancel a Reservation

```bash
curl -X DELETE http://localhost:3000/api/v1/reservations/1
```

## Test Scenarios

### Scenario 1: Double-Booking Prevention

First, create a reservation:

```bash
curl -X POST http://localhost:3000/api/v1/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": 1,
    "tableId": 1,
    "customerName": "Alice",
    "customerPhone": "+1111111111",
    "partySize": 2,
    "reservationDate": "2024-01-20T19:00:00.000Z",
    "duration": 120
  }'
```

Then try to book the same table at overlapping time:

```bash
curl -X POST http://localhost:3000/api/v1/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": 1,
    "tableId": 1,
    "customerName": "Bob",
    "customerPhone": "+2222222222",
    "partySize": 2,
    "reservationDate": "2024-01-20T20:00:00.000Z",
    "duration": 120
  }'
```

Expected: Should fail with 409 error

### Scenario 2: Capacity Mismatch

```bash
curl -X POST http://localhost:3000/api/v1/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": 1,
    "tableId": 1,
    "customerName": "Large Party",
    "customerPhone": "+3333333333",
    "partySize": 8,
    "reservationDate": "2024-01-21T19:00:00.000Z",
    "duration": 120
  }'
```

Expected: Should fail if table capacity is less than 8

### Scenario 3: Outside Operating Hours

```bash
curl -X POST http://localhost:3000/api/v1/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": 1,
    "customerName": "Night Owl",
    "customerPhone": "+4444444444",
    "partySize": 2,
    "reservationDate": "2024-01-20T23:00:00.000Z",
    "duration": 120
  }'
```

Expected: Should fail as it's outside 10:00-22:00 operating hours

## Using with Postman

1. Import these as a collection
2. Set environment variable: `baseUrl = http://localhost:3000`
3. Use `{{baseUrl}}` in requests

## Using with HTTPie

```bash
# Create restaurant
http POST localhost:3000/api/v1/restaurants \
  name="The Gourmet Bistro" \
  openingTime="10:00:00" \
  closingTime="22:00:00"

# Create reservation
http POST localhost:3000/api/v1/reservations \
  restaurantId:=1 \
  customerName="John Doe" \
  customerPhone="+1234567890" \
  partySize:=4 \
  reservationDate="2024-01-20T19:00:00.000Z" \
  duration:=120
```
