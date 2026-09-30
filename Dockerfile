# Multi-stage build for Java Spring Boot
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app

# Copy root and backend pom.xml
COPY pom.xml .
COPY backend/pom.xml ./backend/
RUN mvn dependency:go-offline -B || true

# Copy source trees
COPY backend/src ./backend/src

# Build application
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Install runtime utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy JAR from builder
COPY --from=builder /app/backend/target/*.jar app.jar

# Create directories
RUN mkdir -p /var/log/ai-crime-analytics uploads reports logs data

# Expose port
EXPOSE 8080

# Environment variables
ENV JAVA_OPTS="-Xmx512m -Xms256m"
ENV SPRING_PROFILES_ACTIVE=prod

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Run application
CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
