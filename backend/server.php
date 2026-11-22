<?php

/**
 * Laravel - A PHP Framework For Web Artisans
 *
 * Emulates Apache's mod_rewrite functionality from built-in PHP web server
 */

$uri = urldecode(
    parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? ''
);

if ($uri !== '/' && file_exists(__DIR__.'/public'.$uri)) {
    return false;
}

$start = microtime(true);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
error_log("[".date('H:i:s')."] --> {$method} {$uri}");

register_shutdown_function(function() use ($start, $method, $uri) {
    $ms = round((microtime(true) - $start) * 1000, 1);
    error_log("[".date('H:i:s')."] <-- {$method} {$uri} [{$ms}ms]");
});

header('Connection: close');

require_once __DIR__.'/public/index.php';
