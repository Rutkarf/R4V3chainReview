# Backend — dartchain.review

Spring Boot **3.5.14** / Java **21** — port **8081**.

```bash
./mvnw spring-boot:run
# health: GET http://localhost:8081/api/health
```

Packages : `config`, `health`, `content`, `community`, `auth`, `common`.  
JPA/Flyway désactivés en scaffold jusqu’à provisionnement Postgres.
