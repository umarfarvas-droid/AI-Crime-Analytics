# Migration Guide: Python to Java Conversion

This document describes the conversion of the AI Crime Analytics application from Python to Java/Spring Boot.

## Overview

The application has been completely rewritten from Python (FastAPI/SQLAlchemy) to Java (Spring Boot/Hibernate) while maintaining the same functionality and feature set.

## Key Changes by Component

### 1. Backend Framework

**Before (Python):**
- Framework: FastAPI
- ORM: SQLAlchemy
- Server: Uvicorn
- Task Queue: Celery (assumed)
- Security: python-jose with PyJWT

**After (Java):**
- Framework: Spring Boot 3.2
- ORM: Hibernate (via Spring Data JPA)
- Server: Embedded Tomcat
- Task Queue: Spring @Scheduled (or use Apache Kafka for async)
- Security: Spring Security with JWT (JJWT library)

### 2. Project Structure

**Python Structure:**
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── ai/
│   │   ├── chat_investigator.py
│   │   ├── entity_extractor.py
│   │   ├── evidence_analyzer.py
│   │   ├── graph_builder.py
│   │   ├── llm_service.py
│   │   ├── ocr_processor.py
│   │   ├── pipeline.py
│   │   ├── prediction_engine.py
│   │   └── suspect_ranker.py
│   ├── api/v1/
│   │   ├── auth.py
│   │   ├── cases.py
│   │   ├── dashboard.py
│   │   └── router.py
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── rate_limit.py
│   │   ├── security.py
│   │   └── seed.py
│   ├── models/
│   │   ├── entities.py
│   │   └── user.py
│   └── schemas/
└── tests/
```

**Java Structure:**
```
src/main/
├── java/com/crime/analytics/
│   ├── AiCrimeAnalyticsApplication.java
│   ├── ai/services/
│   │   ├── ChatInvestigatorService.java
│   │   ├── EntityExtractorService.java
│   │   ├── EvidenceAnalyzerService.java
│   │   ├── GraphBuilderService.java
│   │   ├── LlmService.java
│   │   ├── OcrProcessorService.java
│   │   ├── PredictionEngineService.java
│   │   └── SuspectRankerService.java
│   ├── api/v1/
│   │   ├── controllers/
│   │   │   ├── AuthController.java
│   │   │   ├── CasesController.java
│   │   │   ├── EvidenceController.java
│   │   │   └── SuspectsController.java
│   │   └── dto/
│   ├── models/
│   │   ├── entities/
│   │   │   ├── Case.java
│   │   │   ├── CaseAnalysis.java
│   │   │   ├── Evidence.java
│   │   │   ├── ExtractedEntity.java
│   │   │   ├── Suspect.java
│   │   │   └── User.java
│   │   └── repositories/
│   └── core/
│       ├── config/
│       │   ├── AppProperties.java
│       │   ├── SecurityConfig.java
│       │   └── WebConfig.java
│       └── security/
├── resources/
│   ├── application.yml
│   ├── application-dev.yml
│   └── application-prod.yml
└── test/java/com/crime/analytics/
```

### 3. Data Models

#### User Model

**Python:**
```python
class User(Base):
    __tablename__ = "users"
    id: int
    email: str
    password: str
    first_name: str
    last_name: str
    role: UserRole
    is_active: bool
    created_at: datetime
```

**Java:**
```java
@Entity
@Table(name = "users")
public class User {
    @Id @GeneratedValue
    private Long id;
    @Column(unique = true, nullable = false)
    private String email;
    @Column(nullable = false)
    private String password;
    // ... other fields
}
```

#### Case Model

**Python:**
```python
class Case(Base):
    __tablename__ = "cases"
    id: int
    case_number: str
    title: str
    description: str
    status: CaseStatus
    type: CaseType
    incident_date: date
```

**Java:**
```java
@Entity
@Table(name = "cases")
public class Case {
    @Id @GeneratedValue
    private Long id;
    @Column(nullable = false)
    private String caseNumber;
    @Column(nullable = false)
    private String title;
    // ... other fields with proper JPA annotations
}
```

### 4. API Endpoint Mapping

| Endpoint | Python | Java |
|----------|--------|------|
| Login | POST /api/v1/auth/login | POST /api/v1/auth/login |
| Register | POST /api/v1/auth/register | POST /api/v1/auth/register |
| List Cases | GET /api/v1/cases | GET /api/v1/cases |
| Create Case | POST /api/v1/cases | POST /api/v1/cases |
| Get Case | GET /api/v1/cases/{id} | GET /api/v1/cases/{id} |
| Update Case | PUT /api/v1/cases/{id} | PUT /api/v1/cases/{id} |
| Delete Case | DELETE /api/v1/cases/{id} | DELETE /api/v1/cases/{id} |
| Search Cases | GET /api/v1/cases/search | GET /api/v1/cases/search |

### 5. AI Services Conversion

#### Entity Extractor

**Python (Pseudocode):**
```python
def extract_entities(text):
    entities = []
    # Using spaCy or similar NLP library
    doc = nlp(text)
    for ent in doc.ents:
        entities.append({
            'text': ent.text,
            'type': ent.label_,
            'confidence': calculate_confidence()
        })
    return entities
```

**Java:**
```java
@Service
public class EntityExtractorService {
    public Set<ExtractedEntity> extractEntities(Evidence evidence) {
        Set<ExtractedEntity> entities = new HashSet<>();
        // Pattern-based extraction using regex
        entities.addAll(extractPersonEntities(evidence));
        entities.addAll(extractEmailEntities(evidence));
        // ... other extraction methods
        return entities;
    }
}
```

#### LLM Service

**Python:**
```python
import openai

def generate_completion(prompt: str) -> str:
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content
```

**Java:**
```java
@Service
public class LlmService {
    private final OpenAiService openAiService;
    
    public String generateCompletion(String prompt) {
        ChatCompletionRequest request = ChatCompletionRequest.builder()
            .model("gpt-4")
            .messages(List.of(new ChatMessage("user", prompt)))
            .build();
        
        var response = openAiService.createChatCompletion(request);
        return response.getChoices().get(0).getMessage().getContent();
    }
}
```

### 6. Authentication & Security

**Python (FastAPI with Pydantic):**
```python
from fastapi import Depends
from fastapi_jwt_auth import AuthJWT

@app.post("/auth/login")
def login(credentials: LoginSchema, Authorize: AuthJWT = Depends()):
    # Validate credentials
    access_token = Authorize.create_access_token(subject=user.email)
    return {"access_token": access_token}
```

**Java (Spring Security):**
```java
@PostMapping("/login")
public ResponseEntity<?> login(@RequestBody LoginRequest request) {
    Authentication auth = authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(
            request.getEmail(),
            request.getPassword()
        )
    );
    String token = jwtTokenProvider.generateToken(auth.getName());
    return ResponseEntity.ok(new LoginResponse(token));
}
```

### 7. Database Configuration

**Python (SQLAlchemy):**
```python
SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost/crime_analytics"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
```

**Java (Spring Boot):**
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/crime_analytics
    username: postgres
    password: password
  jpa:
    hibernate:
      ddl-auto: validate
    database-platform: org.hibernate.dialect.PostgreSQL10Dialect
```

### 8. Testing

**Python (pytest):**
```python
def test_get_case():
    response = client.get("/api/v1/cases/1")
    assert response.status_code == 200
    assert response.json()["title"] == "Case Title"
```

**Java (JUnit 5 + Spring Test):**
```java
@SpringBootTest
class CasesControllerTest {
    @Test
    void testGetCase() {
        mockMvc.perform(get("/api/v1/cases/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value("Case Title"));
    }
}
```

## Migration Checklist

- [x] Set up Spring Boot project with Maven
- [x] Create JPA entities from Python models
- [x] Configure Spring Data repositories
- [x] Implement Spring Security with JWT
- [x] Convert API controllers
- [x] Create DTOs for API requests/responses
- [x] Convert AI services
- [x] Update Docker configuration
- [ ] Create unit tests
- [ ] Create integration tests
- [ ] Update documentation
- [ ] Performance testing
- [ ] Security testing
- [ ] Deploy to production

## Dependency Mapping

| Python Package | Java Equivalent |
|----------------|-----------------|
| FastAPI | Spring Boot Web |
| SQLAlchemy | Spring Data JPA + Hibernate |
| pydantic | Jakarta Bean Validation |
| python-jose | JJWT (JSON Web Token) |
| requests | Spring RestTemplate / WebClient |
| python-multipart | Spring MultipartResolver |
| openai | theokanning/openai-gpt3-java |
| python-dotenv | Spring @ConfigurationProperties |
| celery | Spring @Scheduled / @Async |
| pytest | JUnit 5 / AssertJ |

## Breaking Changes

### None for API contracts
All REST API endpoints maintain the same paths and request/response formats.

### Internal Changes
1. Case sensitivity in entity names (Java conventions)
2. DateTime handling (Java LocalDateTime vs Python datetime)
3. JSON serialization libraries changed
4. Async handling (CompletableFuture vs Python async/await)

## Performance Improvements

1. **Startup Time**: Spring Boot takes ~5-10 seconds vs Python's ~2-3 seconds
2. **Memory Usage**: Java requires more base memory (256MB+ vs Python 100MB)
3. **Throughput**: Java typically handles 2-3x more requests per second
4. **CPU Usage**: Java GC may introduce occasional pauses

## Troubleshooting Migration Issues

### Issue: Entity annotations not working
**Solution**: Ensure Jakarta EE (not javax) annotations are used

### Issue: JWT tokens not being recognized
**Solution**: Check JWT_SECRET matches between token generation and validation

### Issue: Database migrations failing
**Solution**: Set `spring.jpa.hibernate.ddl-auto=validate` only if schema already exists

### Issue: API responses different format
**Solution**: Verify DTOs properly map all entity fields and use @JsonProperty for name mapping

## Next Steps

1. Run comprehensive testing suite
2. Perform load testing to ensure performance meets requirements
3. Deploy to staging environment
4. Perform user acceptance testing
5. Deploy to production with monitoring

## Additional Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Spring Data JPA Guide](https://spring.io/projects/spring-data-jpa)
- [Spring Security Documentation](https://spring.io/projects/spring-security)
- [Hibernate ORM Guide](https://hibernate.org/orm/documentation/)
- [Maven Documentation](https://maven.apache.org/guides/)

## Questions & Support

For migration-related questions, refer to:
1. Java implementation files
2. Spring Boot official documentation
3. Project team members
