<?php

return [
    /*
    |--------------------------------------------------------------------------
    | FastAPI assistant-service (RAG + Ollama)
    |--------------------------------------------------------------------------
    */
    'base_url' => rtrim(env('ASSISTANT_SERVICE_URL', 'http://127.0.0.1:8090'), '/'),
    'timeout' => (int) env('ASSISTANT_TIMEOUT', 120),
];
