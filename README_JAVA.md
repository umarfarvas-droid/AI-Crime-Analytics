# AI Crime Analytics - Java Edition

A modern Spring Boot-based AI-powered crime investigation analytics system that leverages machine learning and natural language processing to assist law enforcement in analyzing cases, ranking suspects, and extracting insights from evidence.

## Architecture Overview

This project has been converted from Python to Java using Spring Boot framework with the following components:

- **Backend**: Spring Boot 3.2 REST API with JPA/Hibernate
- **Frontend**: Next.js/TypeScript (keeping existing frontend)
- **Database**: PostgreSQL for relational data, Neo4j for entity graphs
- **AI/ML**: OpenAI GPT integration, Entity extraction, Evidence analysis
- **Authentication**: JWT-based security with Spring Security

## Tech Stack

### Backend (Java)
- **Framework**: Spring Boot 3.2
- **Build Tool**: Maven
- **JDK**: Java 17+
- **ORM**: Hibernate/Spring Data JPA
- **Security**: Spring Security with JWT
- **API**: RESTful API with OpenAPI/Swagger
- **Database**: PostgreSQL 15
- **Graph DB**: Neo4j 5 (for entity relationships)
- **ML Libraries**:
  - DeepLearning4j (DL4J) - neural networks
  - OpenAI API - LLM integration
  - Tess4j - OCR processing

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom React components

## Project Structure

```
.
├── pom.xml                                 # Maven configuration
├── docker-compose.yml                      # Docker orchestration
├── Dockerfile                              # Backend Docker image
├── README.md                               # This file
│
├── src/main/
│   ├── java/com/crime/analytics/
│   │   ├── AiCrimeAnalyticsApplication.java  # Spring Boot entry point
│   │   ├── ai/
│   │   │   └── services/                   # AI services
│   │   │       ├── LlmService.java         # LLM interactions
│   │   │       ├── EntityExtractorService.java
│   │   │       ├── EvidenceAnalyzerService.java
│   │   │       ├── SuspectRankerService.java
│   │   │       ├── OcrProcessorService.java
│   │   │       ├── GraphBuilderService.java
│   │   │       └── ChatInvestigatorService.java
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── controllers/            # REST controllers
│   │   │       │   ├── AuthController.java
│   │   │       │   ├── CasesController.java
│   │   │       │   ├── EvidenceController.java
│   │   │       │   └── SuspectsController.java
│   │   │       └── dto/                    # Data transfer objects
│   │   ├── models/
│   │   │   ├── entities/                   # JPA entities
│   │   │   │   ├── User.java
│   │   │   │   ├── Case.java
│   │   │   │   ├── Evidence.java
│   │   │   │   ├── Suspect.java
│   │   │   │   ├── ExtractedEntity.java
│   │   │   │   └── CaseAnalysis.java
│   │   │   └── repositories/               # Spring Data repositories
│   │   └── core/
│   │       ├── config/                     # Spring configuration
│   │       │   ├── AppProperties.java
│   │       │   ├── SecurityConfig.java
│   │       │   └── WebConfig.java
│   │       └── security/                   # Security components
│   │           ├── JwtTokenProvider.java
│   │           ├── JwtAuthenticationFilter.java
│   │           └── JwtAuthenticationEntryPoint.java
│   └── resources/
│       ├── application.yml                 # Main config
│       ├── application-dev.yml             # Development profile
│       ├── application-prod.yml            # Production profile
│       └── templates/                      # Thymeleaf templates
│
├── database/
│   └── init.sql                            # Database initialization
│
└── frontend/                               # Next.js frontend
    ├── src/
    │   ├── app/
    │   │   ├── globals.css
    │   │   ├── layout.tsx
    │   │   ├── page.tsx
    │   │   ├── dashboard/
    │   │   ├── cases/
    │   │   ├── analytics/
    │   │   └── search/
    │   ├── components/
    │   └── lib/
    └── package.json
```

## Prerequisites

- Java 17 or higher
- Maven 3.8.1+
- Docker & Docker Compose
- Node.js 18+ (for frontend)
- PostgreSQL 15+ (if running without Docker)

## Installation

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-crime-analytics
   ```

2. **Create environment file**
   ```bash
   cat > .env << EOF
   OPENAI_API_KEY=your_openai_api_key
   JWT_SECRET=your_jwt_secret_key
   EOF
   ```

3. **Start containers**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080/api
   - Neo4j Browser: http://localhost:7474

### Manual Installation

1. **Backend Setup**
   ```bash
   # Install dependencies
   mvn clean install

   # Run development server
   mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"
   ```

2. **Database Setup**
   ```bash
   # Create PostgreSQL database
   psql -U postgres -c "CREATE DATABASE crime_analytics;"
   
   # Run migrations
   psql -U postgres -d crime_analytics < database/init.sql
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Configuration

### Environment Variables

```bash
# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/crime_analytics
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=password

# OpenAI Integration
OPENAI_API_KEY=your_openai_api_key

# Security
JWT_SECRET=your-secret-key-min-32-characters
JWT_EXPIRATION=86400000  # 24 hours in milliseconds

# CORS
CORS_ORIGINS=http://localhost:3000

# Spring Profile
SPRING_PROFILES_ACTIVE=dev|prod
```

### Application Properties

Modify `src/main/resources/application.yml` for configuration:

```yaml
spring:
  application:
    name: ai-crime-analytics
  jpa:
    hibernate:
      ddl-auto: validate
  datasource:
    url: jdbc:postgresql://localhost:5432/crime_analytics

app:
  jwt:
    secret: ${JWT_SECRET}
  ai:
    openai-api-key: ${OPENAI_API_KEY}
    model: gpt-4
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/forgot-password` - Password recovery

### Cases
- `GET /api/v1/cases` - List all cases
- `POST /api/v1/cases` - Create new case
- `GET /api/v1/cases/{id}` - Get case details
- `PUT /api/v1/cases/{id}` - Update case
- `DELETE /api/v1/cases/{id}` - Delete case
- `GET /api/v1/cases/{id}/suspects/ranked` - Get ranked suspects

### Evidence
- `GET /api/v1/evidence` - List evidence
- `POST /api/v1/evidence` - Upload evidence
- `GET /api/v1/evidence/{id}` - Get evidence details
- `DELETE /api/v1/evidence/{id}` - Delete evidence

### Suspects
- `GET /api/v1/suspects` - List suspects
- `GET /api/v1/suspects/{id}` - Get suspect details
- `PUT /api/v1/suspects/{id}` - Update suspect

## Key Features

### 1. **Case Management**
- Create and track criminal cases
- Assign cases to investigators
- Monitor case status and priority
- Generate comprehensive case summaries

### 2. **Evidence Analysis**
- Upload and organize evidence
- OCR processing for document images
- Automatic entity extraction
- Relevance scoring

### 3. **Suspect Ranking**
- AI-powered suspect ranking based on:
  - Risk level and status
  - Motive and opportunity confidence
  - Criminal history
  - Pattern analysis
- Generate suspect profiles

### 4. **Entity Relationship Graphs**
- Build knowledge graphs from extracted entities
- Visualize relationships between persons, organizations, locations
- Find connection paths between entities
- Detect patterns and networks

### 5. **AI Chat Investigator**
- Ask questions about cases
- Get AI-powered insights
- Generate investigation summaries
- Receive recommendations

## Development

### Building the Application

```bash
# Clean build
mvn clean package

# Build without tests
mvn clean package -DskipTests

# Build specific profile
mvn clean package -Pprod
```

### Running Tests

```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=CasesControllerTest

# Run with coverage
mvn clean test jacoco:report
```

### Database Migrations

Hibernately manages schema through JPA annotations. On startup with `spring.jpa.hibernate.ddl-auto=create`, the schema is automatically created.

For manual migrations, use Liquibase or Flyway (to be added to future versions).

## Deployment

### Production Build

```bash
mvn clean package -Pprod
java -jar target/ai-crime-analytics-1.0.0.jar
```

### Docker Deployment

```bash
# Build Docker image
docker build -t crime-analytics:latest .

# Run container
docker run -d \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/crime_analytics \
  -p 8080:8080 \
  crime-analytics:latest
```

### Kubernetes Deployment

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/app-deployment.yaml
kubectl apply -f k8s/service.yaml
```

## Troubleshooting

### Database Connection Issues
```bash
# Test PostgreSQL connection
psql -h localhost -U postgres -d crime_analytics -c "SELECT 1"
```

### Application Won't Start
```bash
# Check logs
docker-compose logs backend

# Or locally
mvn spring-boot:run -X
```

### ORM/JPA Errors
Ensure `spring.jpa.hibernate.ddl-auto` matches your environment:
- `create`: Creates tables (development only)
- `update`: Alters existing schema
- `validate`: Only validates (production)
- `none`: No DDL operations

## Performance Optimization

1. **Database**
   - Index frequently queried columns
   - Use pagination for large datasets
   - Enable connection pooling (HikariCP configured)

2. **Caching**
   - Add Spring Cache abstraction
   - Use Redis for distributed caching
   - Cache case and suspect rankings

3. **AI Services**
   - Implement async processing for heavy computations
   - Cache LLM responses
   - Batch entity extraction operations

## Security Considerations

1. **Authentication**
   - JWT tokens expire after 24 hours
   - Passwords hashed with BCrypt
   - CORS enabled only for trusted origins

2. **Data Protection**
   - Use environment variables for secrets
   - Enable HTTPS in production
   - Implement row-level security in database

3. **API Security**
   - Rate limiting on authentication endpoints
   - Request validation with JSR-303
   - SQL injection prevention through parameterized queries

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Future Enhancements

- [ ] Graph database visualization UI
- [ ] Advanced ML models for suspect ranking
- [ ] Real-time case collaboration features
- [ ] Evidence file versioning
- [ ] Automated investigation workflows
- [ ] Mobile application
- [ ] Multi-language support
- [ ] Advanced search with Elasticsearch
- [ ] Audit logging for compliance
- [ ] Batch processing for large datasets

## License

This project is licensed under the MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check existing GitHub issues
2. Create new issue with detailed description
3. Contact: support@crime-analytics.local

## Acknowledgments

- OpenAI for GPT integration
- Spring Framework team
- PostgreSQL and Neo4j communities
- Contributors and testers
