# 📚 Library Rental API v2.1 — MySQL + Swagger

Node.js + Express + **MySQL** (Sequelize ORM) + Swagger UI.

---

## 🚀 Швидкий старт

### 1. Встановити залежності
```bash
npm install
```

### 2. Створити базу даних у MySQL
```sql
CREATE DATABASE library_rental CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Налаштувати `.env`
```bash
cp .env.example .env
```

Відкрити `.env` і заповнити:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=library_rental
DB_USER=root
DB_PASSWORD=your_password
PORT=3000
```

### 4. Заповнити базу початковими книгами
```bash
npm run seed
```

### 5. Запустити сервер
```bash
npm start       # продакшн
npm run dev     # розробка (nodemon)
```

- Сервер:  **http://localhost:3000**
- Swagger: **http://localhost:3000/api-docs**

---

## 📁 Структура

```
library-apiVF/
├── app.js               # Express-додаток (без listen)
├── server.js            # Сумісність: підключає bin/www
├── bin/www              # Точка входу: БД + HTTP
├── config/
│   ├── database.js      # Sequelize / MySQL
│   └── seed.js          # Початкові дані
├── models/
│   └── Book.js          # Модель books
├── controllers/         # Логіка запитів
├── routes/              # Маршрути + Swagger JSDoc
├── middleware/
├── tests/               # Jest + Supertest
├── swagger/
├── public/
└── logs/
```

---

## 🗄️ Таблиця `books` (створюється автоматично)

| Колонка    | Тип          | Опис                     |
|------------|--------------|--------------------------|
| id         | INT, PK, AI  | Автоінкрементний ID      |
| title      | VARCHAR(255) | Назва книги              |
| author     | VARCHAR(255) | Автор                    |
| year       | INT          | Рік видання              |
| genre      | VARCHAR(100) | Жанр                     |
| available  | BOOLEAN      | Доступна для оренди      |
| rented_by  | VARCHAR(255) | Ім'я орендаря            |
| rented_at  | DATETIME     | Дата початку оренди      |
| rent_count | INT          | Загальна кількість оренд |
| created_at | DATETIME     | Дата створення           |
| updated_at | DATETIME     | Останнє оновлення        |

---

## 🔌 Ендпоінти

### Books `/api/books`
| Метод  | Шлях                      | Опис              |
|--------|---------------------------|-------------------|
| GET    | /api/books                | Всі книги         |
| GET    | /api/books?available=true | Тільки доступні   |
| GET    | /api/books?genre=Поезія   | По жанру          |
| GET    | /api/books/:id            | Книга за ID       |
| POST   | /api/books                | Додати книгу      |
| DELETE | /api/books/:id            | Видалити книгу    |

### Rentals `/api/rentals`
| Метод  | Шлях                | Опис              |
|--------|---------------------|-------------------|
| GET    | /api/rentals        | Орендовані книги  |
| POST   | /api/rentals/rent   | Орендувати        |
| POST   | /api/rentals/return | Повернути         |

### Stats `/api/stats`
| Метод  | Шлях              | Опис                   |
|--------|-------------------|------------------------|
| GET    | /api/stats        | Загальна статистика    |
| GET    | /api/stats/genres | По жанрах (GROUP BY)   |
| GET    | /api/stats/top    | Топ книг за орендами   |
