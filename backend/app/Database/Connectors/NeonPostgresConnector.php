<?php

namespace App\Database\Connectors;

use Illuminate\Database\Connectors\PostgresConnector;

/**
 * Neon PostgreSQL on Windows/XAMPP needs endpoint ID when libpq lacks SNI support.
 * @see https://neon.tech/sni
 */
class NeonPostgresConnector extends PostgresConnector
{
    protected function addSslOptions($dsn, array $config)
    {
        $dsn = parent::addSslOptions($dsn, $config);

        if (! empty($config['endpoint_id'])) {
            // libpq on Windows/XAMPP requires quoted options (not URL-encoded)
            $dsn .= ";options='endpoint={$config['endpoint_id']}'";
        }

        return $dsn;
    }
}
