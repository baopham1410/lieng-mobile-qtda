# Backend (Laravel API)

REST API cho Admin + module Quan. Stack: Laravel + Sanctum + PostgreSQL.

## Setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# Cau hinh DB (Neon/PostgreSQL) trong .env
php artisan migrate --seed
php artisan serve --host=0.0.0.0 --port=8080
```

## Luu y

- Khong commit file `.env`
- Chay `composer install` de tao `vendor/`
