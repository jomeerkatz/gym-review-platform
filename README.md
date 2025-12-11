# Gym Review Platform – Spring Boot, Elasticsearch & Keycloak

Backend-focused portfolio project: a secure Gym Review API with full-text & geo search on Elasticsearch, OAuth2/JWT security with Keycloak, photo uploads, and a small Next.js frontend for interacting with the API.

> This project was intentionally designed to showcase the skills typically expected from a junior Java Spring Boot backend developer in Hamburg/Germany in 2025/2026.  

---

## Demo

_A short walkthrough video will be added here._

```text
▶️ YouTube demo link goes here
```

---

## Why this project matters for backend roles

This repository demonstrates:

- Realistic **domain modeling** (gyms, addresses, opening hours, reviews, photos, geo-location).
- Modern **REST API design** (pagination, sorting, validation, DTOs).
- **Security** with OAuth2 Resource Server, JWT and Keycloak.
- **Search & geo queries** using Elasticsearch (full-text, fuzzy, and radius search).
- **File uploads** with secure file-system storage and MIME-type handling.
- **Docker-based local infrastructure** (Elasticsearch, Kibana, Keycloak).
- Clean layered architecture (Controller → Service → Repository → Storage).

The domain (gyms & fitness) is just a concrete use case; the focus is on backend architecture and production-style concerns, not on the hobby itself.

---

## High-level overview

- Users can:
  - Browse gyms with full-text search, minimum rating filters, and “nearby gyms” via geo-radius.
  - View detailed gym information, including opening hours, location, photos, and reviews.
  - Create, edit, and delete their own reviews (1 review per user per gym, 24h edit window).
  - Upload photos for gyms and reviews.

- The backend:
  - Exposes REST endpoints under `/api/gyms`, `/api/gyms/{gymId}/reviews`, `/api/photos`.
  - Stores gym & review data in **Elasticsearch** documents.
  - Stores photos on the **file system** with path-traversal protection.
  - Protects write operations via **JWT** issued by **Keycloak** (OAuth2 Resource Server).

- The frontend (folder `gym-review-frontend/`):
  - Next.js + Tailwind client that consumes the API and handles Keycloak login.
  - Exists mainly for manual testing and demonstration of the backend.

---

## Tech stack

**Backend**

- Java (modern LTS)
- Spring Boot (Web, Validation)
- Spring Security – OAuth2 Resource Server (JWT)
- Spring Data Elasticsearch
- MapStruct, Lombok
- Jakarta Bean Validation
- SLF4J / Logback

**Infrastructure**

- Elasticsearch
- Kibana
- Keycloak (H2 file-based)
- Docker & Docker Compose

**Frontend (supporting, not the focus of this README)**

- Next.js App Router
- TypeScript, React
- Tailwind CSS
- PKCE-based Keycloak login

---

## Core backend features

### 1. Gym management

- CRUD for gyms (create, update, delete, get by id, list).
- Domain model includes:
  - `Gym` with name, description, categories, rating summary, and geo-location.
  - `Address` value object.
  - `OperatingHours` per weekday with time-range validation.
  - Photos and reviews as nested structures.

- DTO design:
  - **Summary DTOs** for listing (e.g. name, rating, distance).
  - **Detail DTOs** for full gym view (address, hours, photos, reviews).

### 2. Search & geo features

- Full-text search on gym name/description.
- Fuzzy search for tolerant matching of user input.
- Filter by minimum average rating.
- Geo-radius search using Elasticsearch `geo_distance` queries.
- Combination of filters (text + rating + radius) in a single endpoint.

### 3. Review management

- Users can create, edit and delete their own reviews.
- Business rules:
  - One review per user per gym.
  - Reviews can only be edited for the first **24 hours**.
  - Rating must be between 1 and 5.
- Backend recalculates:
  - `averageRating`
  - `totalReviews`
- Reviews are sortable and pageable (e.g. newest first, highest rated).

### 4. Photo upload & storage

- Multipart upload endpoints for gym and review photos.
- Files are stored on disk under a configurable root directory.
- Safety:
  - Path-traversal protection (no `../` escapes).
  - File extension based on original filename.
  - Content-Type inferred for responses.
- Photos are exposed via a dedicated `/api/photos/{id}` endpoint.

### 5. Validation & error handling

- Extensive DTO validation with Jakarta Bean Validation:
  - `@NotBlank`, `@Pattern`, `@Size`, `@Min`/`@Max`, etc.
  - Time ranges and addresses must match specific formats.
  - At least one photo required when creating a gym.
- Centralized error handling:
  - `@ControllerAdvice` maps domain-specific exceptions (e.g. `GymNotFound`, `ReviewNotAllowed`, `StorageException`) to proper HTTP responses.
  - Validation errors are aggregated and returned with structured field messages.

### 6. Security

- Spring Security configured as **OAuth2 Resource Server**.
- JWT tokens issued by Keycloak (local instance via Docker Compose).
- Stateless session handling.
- CSRF disabled for API use case.
- CORS configured for the local Next.js origin (`http://localhost:3000`).
- Access rules:
  - Public: `GET` endpoints for listing gyms, reading details, and fetching photos.
  - Protected: any mutating operations (create/update/delete gyms & reviews) require a valid JWT.

### 7. Logging & monitoring

- SLF4J logging in critical components (storage, global error handler).
- (Optional future work) Spring Boot Actuator & health endpoints.

---

## Project structure

From the repository root:

```text
.
├── docker-compose.yaml      # Elasticsearch, Kibana, Keycloak stack
├── pom.xml                  # Spring Boot backend
├── src/                     # Java backend source code
├── gym-review-frontend/     # Next.js frontend (separate app)
└── ...                      # Maven wrapper, IDE config, etc.
```

- This `README.md` is backend-focused.
- The frontend has its own README inside `gym-review-frontend/` (to be updated).

---

## Getting started

### Prerequisites

- Java (LTS, e.g. 17 or 21)
- Maven
- Docker & Docker Compose
- Node.js (only if you want to run the frontend)

### 1. Start infrastructure (Elasticsearch, Kibana, Keycloak)

From the repository root:

```bash
docker compose up -d
```

This will start:

- Elasticsearch
- Kibana
- Keycloak (with H2 file storage)

Check that the services are up (e.g. Kibana UI, Keycloak admin console) before starting the backend.

### 2. Run the backend

From the repository root:

```bash
./mvnw spring-boot:run
# or
mvn spring-boot:run
```

The API is available at:

```text
http://localhost:8080
```

Key endpoints (examples):

- `GET /api/gyms` – list gyms with pagination & filters
- `GET /api/gyms/{id}` – gym details
- `GET /api/gyms/search` – full-text/geo search
- `POST /api/gyms` – create gym (JWT required)
- `POST /api/gyms/{gymId}/reviews` – create review (JWT required)
- `GET /api/photos/{photoId}` – fetch a photo

### 3. Run the frontend (optional)

From `gym-review-frontend/`:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

The frontend provides:

- Gym list + detail views
- Review creation/editing
- Photo uploads
- Keycloak login through PKCE

---

## Testing

_Current state:_

- Basic Spring Boot context test.
- Data loader for manual testing.

_Possible extensions:_

- Unit tests for:
  - rating recalculation
  - 24-hour edit rule
  - review constraints
- Controller/Integration tests for:
  - public vs. protected endpoints
  - validation error responses
- Security tests (JWT-required paths).

Having these in place makes it easy to talk about testing strategy in interviews and clearly shows quality focus.

---

## Possible future improvements

- Add a relational database module using JPA/Hibernate & PostgreSQL.
- Expose OpenAPI/Swagger documentation for the REST API.
- Introduce Spring Boot Actuator and metrics (health, readiness, custom metrics).
- Containerize the backend itself (Dockerfile) and extend the compose stack.
- Add CI/CD pipeline (GitHub Actions) to build & test on each push.

---

## Quick summary for hiring managers

- **Real-world domain**: gyms, reviews, ratings, geo-search, opening hours.
- **Modern backend stack**: Spring Boot, Spring Security (OAuth2/JWT), Elasticsearch, Docker.
- **Security**: OAuth2 Resource Server with Keycloak, JWT-protected write operations.
- **Architecture**: Layered design, DTO mapping with MapStruct, centralized error handling.
- **Production concerns**: validation, file uploads, CORS, dockerized infra, pagination, sorting.

If you want to quickly understand the project, watch the short demo video (link in the **Demo** section) and then browse the `src/` folder for the controllers, services, and Elasticsearch mappings.
