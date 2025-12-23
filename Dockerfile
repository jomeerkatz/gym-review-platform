# ============================================
# Stage 1: Build
# ============================================
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /build

# Copy Maven wrapper and pom.xml first (for dependency caching)
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Download all dependencies (cached layer unless pom.xml changes)
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY src/ ./src/

# Build the application (skip tests for faster builds in production)
# MapStruct & Lombok annotation processors run automatically via maven-compiler-plugin
RUN ./mvnw clean package -DskipTests

# ============================================
# Stage 2: Runtime
# ============================================
FROM eclipse-temurin:21-jre-alpine AS runtime

# Create non-root user for security best practices
RUN addgroup -S spring && adduser -S spring -G spring

WORKDIR /app

# Copy only the built JAR from builder stage
COPY --from=builder /build/target/gym-0.0.1-SNAPSHOT.jar app.jar

# Create directory for file uploads (your photo storage)
RUN mkdir -p /app/uploads && chown -R spring:spring /app

# Switch to non-root user
USER spring:spring

# Railway dynamically assigns $PORT
EXPOSE 8080

# JVM optimization for container environments
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+UseContainerSupport"

# Start application with Railway's PORT and environment variables
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=${PORT:-8080} -jar app.jar"]
