# Shield API

A secure, production-ready RESTful API built with Node.js, TypeScript, Express, and Prisma. Shield provides user authentication, wallet management, and comprehensive API documentation with Swagger UI.

## Features

- **Authentication & Authorization**: JWT-based authentication with access and refresh tokens
- **Wallet Management**: Create, read, update, and delete cryptocurrency wallet addresses
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis integration for session management and caching
- **API Documentation**: Interactive Swagger UI documentation
- **Security**: Password hashing with bcrypt, input validation, and ownership checks
- **Type Safety**: Full TypeScript support with strict type checking
- **Dependency Injection**: TypeDI for clean architecture
- **Testing**: Comprehensive unit tests with Vitest
- **Docker Support**: Multi-stage Dockerfile and docker-compose for easy deployment

## Tech Stack

- **Runtime**: Node.js 20
- **Framework**: Express 5
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: class-validator
- **API Routing**: routing-controllers
- **Documentation**: Swagger UI
- **Testing**: Vitest
- **Containerization**: Docker & Docker Compose

## Prerequisites

- Git
- Docker & Docker Compose

## Installation

### Local Run

1. **Clone the repository**

   ```bash
   git clone https://github.com/brigere/shield-api.git
   cd shield
   ```

2. **build with docker compose**
   ```bash
   docker compose up --build
   ```

## API Documentation

Once the application is running, visit the interactive API documentation:

**Swagger UI**: `http://localhost:3000/api/swagger-ui`

The documentation includes:

- All available endpoints
- Request/response schemas
- Authentication requirements
- Try-it-out functionality

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive tokens
- `POST /api/auth/refresh` - Refresh access token

### Wallets

- `GET /api/wallets` - Get all wallets for authenticated user
- `GET /api/wallets/:id` - Get a specific wallet
- `POST /api/wallets` - Create a new wallet
- `PUT /api/wallets/:id` - Update a wallet
- `DELETE /api/wallets/:id` - Delete a wallet

## Important notes about scopes

- The project contains a very basic unit test configuration just for demo.
- All env variables are hardcoded.
- Once you run coker compose a "/data" directory whech is being use as a voulume for Postgres.
- There is no DB optimizations implemented.
