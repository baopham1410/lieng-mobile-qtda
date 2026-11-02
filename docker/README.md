# Docker (tuy chon)

Backend API qua Nginx + PHP container.

```bash
# Can backend/.env (tu .env.example)
docker compose up -d --build
```

API: http://localhost:8080

Frontend/Mobile van chay local (npm / expo), tro VITE_API_URL / EXPO_PUBLIC_API_URL ve http://localhost:8080.
