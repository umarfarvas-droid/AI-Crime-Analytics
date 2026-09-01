# Quick Start Guide - Java Crime Analytics

Get the AI Crime Analytics application up and running in minutes!

## Prerequisites

Before you start, ensure you have:
- Java 17+ ([Download](https://www.oracle.com/java/technologies/javase-jdk17-downloads.html))
- Maven 3.8.1+ ([Download](https://maven.apache.org/download.cgi))
- Docker & Docker Compose ([Download](https://www.docker.com/products/docker-desktop))
- Git ([Download](https://git-scm.com/))

## Option 1: Quick Start with Docker (Recommended)

### 1. Clone and Navigate
```bash
git clone <repository-url>
cd ai-crime-analytics
```

### 2. Create Environment File
```bash
# Create .env file with required variables
echo "OPENAI_API_KEY=sk-..." > .env
echo "JWT_SECRET=your-secret-key-here" >> .env
```

### 3. Start the Application
```bash
# Build and start all services
docker-compose up -d

# Check if services are running
docker-compose ps
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080/api
- **Neo4j Browser**: http://localhost:7474 (username: neo4j, password: password)
- **API Documentation**: http://localhost:8080/api/swagger-ui.html

### 5. Stop the Application
```bash
docker-compose down
```

---

## Option 2: Local Development Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd ai-crime-analytics
```

### 2. Setup Database
```bash
# Start PostgreSQL using Docker
docker run -d \
  --name postgres-crime \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=crime_analytics \
  -p 5432:5432 \
  postgres:15-alpine

# Wait for database to be ready
sleep 5

# Initialize database
psql -h localhost -U postgres -d crime_analytics < database/init.sql
```

### 3. Setup Backend
```bash
# Navigate to project root
cd ai-crime-analytics

# Install dependencies
mvn clean install

# Run with development profile
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"

# Or run the JAR directly
mvn clean package -DskipTests
java -jar target/ai-crime-analytics-1.0.0.jar
```

Backend will be available at: **http://localhost:8080/api**

### 4. Setup Frontend
```bash
# In a new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: **http://localhost:3000**

---

## First Steps

### 1. Create an Account
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "investigator@example.com",
    "password": "SecurePassword123",
    "firstName": "John",
    "lastName": "Investigator"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "investigator@example.com",
    "password": "SecurePassword123"
  }'

# Response will include a JWT token:
# {"token": "eyJhbGciOiJIUzUxMiJ9...", "email": "...", ...}
```

### 3. Create Your First Case
```bash
TOKEN="your_jwt_token_from_login"

curl -X POST http://localhost:8080/api/v1/cases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "caseNumber": "CASE-2024-001",
    "title": "Downtown Burglary",
    "description": "Jewelry store robbery on 5th Avenue",
    "type": "THEFT",
    "priority": "HIGH",
    "incidentDate": "2024-01-15",
    "locationName": "5th Avenue Jewelry Store"
  }'
```

### 4. List Cases
```bash
curl -X GET "http://localhost:8080/api/v1/cases?page=0&size=20" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Development Workflow

### Running Tests
```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=AuthControllerTest

# Run with coverage
mvn clean test jacoco:report
```

### Code Quality
```bash
# Check for style issues
mvn checkstyle:check

# Run static analysis
mvn sonar:sonar
```

### Building for Production
```bash
# Clean build
mvn clean package -Pprod

# Build Docker image
docker build -t crime-analytics:latest .

# Run Docker container
docker run -d \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/crime_analytics \
  -p 8080:8080 \
  crime-analytics:latest
```

---

## Common Tasks

### View Application Logs
```bash
# Docker logs
docker-compose logs -f backend

# Local application logs
tail -f logs/application.log
```

### Reset Database
```bash
# Stop containers
docker-compose down

# Remove volumes
docker volume rm ai-crime-analytics_postgres_data

# Restart
docker-compose up -d
```

### Access Database
```bash
# PostgreSQL
psql -h localhost -U postgres -d crime_analytics

# Neo4j (browser)
# Navigate to http://localhost:7474
# Use 'neo4j' / 'password'
```

### Configure IDE

#### IntelliJ IDEA
1. Open project
2. File → Project Structure → Project → SDK: Java 17
3. File → Project Structure → Modules → Set source/test directories
4. Enable annotation processing: Settings → Build, Execution... → Annotation Processors → Enable

#### Visual Studio Code
1. Install "Extension Pack for Java"
2. Install "Spring Boot Extension Pack"
3. File → Open Folder → Select project
4. Create `.vscode/launch.json` with Spring Boot configuration

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 8080
lsof -i :8080

# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Database Connection Error
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check database connection
psql -h localhost -U postgres -c "SELECT 1"

# If connection fails, restart PostgreSQL
docker restart postgres-crime
```

### Application Won't Start
```bash
# Check for port conflicts
netstat -an | grep LISTEN

# Check logs for errors
docker-compose logs backend

# Verify Java version
java -version

# Clean rebuild
mvn clean install -DskipTests
```

### JWT Token Errors
```bash
# Make sure JWT_SECRET is set
echo $JWT_SECRET

# If not set, configure in application.yml:
app:
  jwt:
    secret: your-secret-key-here
    expiration: 86400000
```

---

## Next Steps

1. **Read Documentation**
   - [README_JAVA.md](README_JAVA.md) - Full project documentation
   - [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Python to Java conversion details
   - [API Documentation](http://localhost:8080/api/swagger-ui.html) - Interactive API docs

2. **Configure Features**
   - Set up OpenAI API key for LLM features
   - Configure OCR for document processing
   - Set up Neo4j for entity graph visualization

3. **Customize**
   - Modify case types and statuses in entity enums
   - Add custom AI service implementations
   - Integrate with external systems via API

4. **Deploy**
   - Push Docker image to registry
   - Set up CI/CD pipeline
   - Configure monitoring and logging
   - Prepare database backups

---

## Performance Tips

- Use pagination for large datasets (default: 20 items per page)
- Enable caching for frequently accessed data
- Monitor database query performance
- Use async processing for heavy AI computations
- Keep application logs in rotation to prevent disk space issues

---

## Getting Help

- **Issues**: Check GitHub Issues
- **Documentation**: Refer to README_JAVA.md
- **API Help**: Use Swagger UI at `/api/swagger-ui.html`
- **Database Help**: Use database admin tools (pgAdmin for PostgreSQL, Neo4j Browser)

---

## Quick Command Reference

```bash
# Build
mvn clean package -DskipTests

# Run locally
mvn spring-boot:run

# Run with profile
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"

# Run tests
mvn test

# Check dependencies
mvn dependency:tree

# Update dependencies
mvn versions:display-dependency-updates

# Docker build
docker build -t crime-analytics:latest .

# Docker run
docker run -p 8080:8080 crime-analytics:latest

# Docker Compose
docker-compose up -d
docker-compose down
docker-compose logs -f
```

---

**Enjoy building with Spring Boot and Java!** 🚀
