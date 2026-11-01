# Backend (Laravel API)

Thu muc API Laravel + Sanctum.

## Chay local (sau khi scaffold)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve --port=8080
```

Issue lien quan: backend / API auth.
