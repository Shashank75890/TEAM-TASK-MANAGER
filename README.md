# TaskFlow – Team Task Manager

A full-stack collaborative team task management application built with **Spring Boot**, **MySQL**, and **Vanilla JavaScript**.

![TaskFlow](https://img.shields.io/badge/Spring%20Boot-3.2.5-brightgreen) ![MySQL](https://img.shields.io/badge/MySQL-8.0-blue) ![Java](https://img.shields.io/badge/Java-17-orange)

---

## Features

- **JWT Authentication** – Secure signup/login with BCrypt password hashing
- **Project Management** – Create projects, add/remove members with role assignment
- **Kanban Task Board** – Visual To Do / In Progress / Done columns
- **Role-Based Access** – Admins manage everything; Members update their assigned tasks
- **Dashboard** – Stats: total tasks, by status, overdue count, per-project breakdown
- **Fully Responsive** – Dark glassmorphism UI, works on all screen sizes

---

## Tech Stack

| Layer      | Technology                       |
|------------|----------------------------------|
| Backend    | Spring Boot 3.2.5, Java 17       |
| Security   | Spring Security + JWT (jjwt)     |
| Database   | MySQL 8 via JPA/Hibernate        |
| Frontend   | HTML5, CSS3, Vanilla JS (ES6+)   |
| Deployment | Railway                          |

---

## Project Structure

```
├── src/main/java/com/taskmanager/
│   ├── config/          SecurityConfig
│   ├── controller/      Auth, Project, Task, Dashboard
│   ├── dto/             Request/Response DTOs
│   ├── entity/          User, Project, ProjectMember, Task
│   ├── repository/      JPA Repositories
│   ├── security/        JWT Filter, JwtUtil, UserDetailsService
│   └── service/         Auth, Project, Task, Dashboard services
├── src/main/resources/
│   ├── application.properties
│   └── static/          Frontend (index, dashboard, project) + CSS/JS
├── Dockerfile
└── pom.xml
```

---

## Local Setup

### Prerequisites
- Java 17+
- Maven 3.8+
- MySQL 8 running locally

### 1. Create Database
```sql
CREATE DATABASE taskmanager;
```

### 2. Configure Environment (optional)
The app uses these defaults — override via environment variables:
```
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/taskmanager?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=password
JWT_SECRET=myVerySecretKeyForJWTThatIsAtLeast256BitsLongForSecurity12345
JWT_EXPIRATION=86400000
```

### 3. Run the Application
```bash
mvn spring-boot:run
```
App starts at **http://localhost:8080**

---

## REST API Reference

### Auth
| Method | Endpoint          | Body                              | Auth |
|--------|-------------------|-----------------------------------|------|
| POST   | /api/auth/signup  | `{name, email, password}`         | No   |
| POST   | /api/auth/login   | `{email, password}`               | No   |

### Projects
| Method | Endpoint                         | Role   |
|--------|----------------------------------|--------|
| POST   | /api/projects                    | Any    |
| GET    | /api/projects                    | Any    |
| GET    | /api/projects/{id}               | Member |
| POST   | /api/projects/{id}/members       | Admin  |
| DELETE | /api/projects/{id}/members/{uid} | Admin  |

### Tasks
| Method | Endpoint                           | Role           |
|--------|------------------------------------|----------------|
| POST   | /api/projects/{id}/tasks           | Admin          |
| GET    | /api/projects/{id}/tasks           | Member+        |
| PUT    | /api/tasks/{id}                    | Admin/Assignee |
| DELETE | /api/tasks/{id}                    | Admin          |

### Dashboard
| Method | Endpoint        |
|--------|-----------------|
| GET    | /api/dashboard  |

All authenticated routes require: `Authorization: Bearer <token>`

---

## Deployment on Railway

### Step 1 – Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/task-manager.git
git push -u origin main
```

### Step 2 – Create Railway Project
1. Go to [railway.app](https://railway.app) and create a new project
2. Click **Deploy from GitHub repo** → select your repo
3. Add a **MySQL** plugin from Railway's plugin marketplace

### Step 3 – Set Environment Variables
In Railway → Your Service → Variables, add:
```
SPRING_DATASOURCE_URL=jdbc:mysql://${{MYSQLHOST}}:${{MYSQLPORT}}/${{MYSQLDATABASE}}?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
SPRING_DATASOURCE_USERNAME=${{MYSQLUSER}}
SPRING_DATASOURCE_PASSWORD=${{MYSQLPASSWORD}}
JWT_SECRET=<generate a random 64-char string>
JWT_EXPIRATION=86400000
PORT=8080
```

### Step 4 – Deploy
Railway auto-detects the Dockerfile and deploys. The public URL will be shown in the Railway dashboard.

---

## Role-Based Access Control

| Feature              | Admin | Member |
|----------------------|-------|--------|
| Create tasks         | ✅    | ❌     |
| Edit all task fields | ✅    | ❌     |
| Update task status   | ✅    | ✅ (own tasks only) |
| Delete tasks         | ✅    | ❌     |
| Add/remove members   | ✅    | ❌     |
| View project tasks   | ✅ all | ✅ assigned only |

---

## License
MIT
