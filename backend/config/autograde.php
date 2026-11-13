<?php

return [
    /*
    |--------------------------------------------------------------------------
    | FastAPI autograde-service (YOLOv8 + PaddleOCR + Valuation Engine)
    |--------------------------------------------------------------------------
    */
    'base_url' => rtrim(env('AUTO_GRADE_URL', 'http://127.0.0.1:8091'), '/'),
    'timeout' => (int) env('AUTO_GRADE_TIMEOUT', 60),
];
