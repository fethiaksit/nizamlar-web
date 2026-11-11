<?php
/**
 * CLI: php tools/migrate_quote_previews.php
 * Safe/idempotent migration: existing quotes and original uploaded files remain unchanged.
 */
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("Only CLI is supported.\n");
}
define('NIZAMLAR_APP', true);
require_once dirname(__DIR__) . '/config/config.php';
require_once dirname(__DIR__) . '/config/db.php';
if (DB_DRIVER !== 'mysql') {
    exit("This migration requires the MySQL installation.\n");
}
$pdo = DB::connect();
$columns = [
    'preview_file_url' => 'VARCHAR(255) NULL',
    'preview_file_name' => 'VARCHAR(255) NULL',
    'preview_file_size' => 'BIGINT NOT NULL DEFAULT 0',
    'preview_mime_type' => 'VARCHAR(100) NULL',
];
foreach ($columns as $column => $type) {
    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'quote_requests'
           AND COLUMN_NAME = ?"
    );
    $stmt->execute([$column]);
    if ((int) $stmt->fetchColumn() === 0) {
        $pdo->exec("ALTER TABLE `quote_requests` ADD COLUMN `$column` $type");
        echo "Added: $column\n";
    } else {
        echo "Already exists: $column\n";
    }
}
echo "Preview migration finished. Existing quotes preserved.\n";
