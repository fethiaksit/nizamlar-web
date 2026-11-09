<?php
/**
 * NİZAMLAR BASKI — VERİTABANI BAĞLANTI KATMANI (PDO)
 * 
 * Prepared statements, hata yakalama, UTF-8mb4 tam destek.
 */

if (!defined('NIZAMLAR_APP')) {
    require_once __DIR__ . '/config.php';
}

class DB {
    private static ?PDO $instance = null;

    public static function connect(): PDO {
        if (self::$instance !== null) {
            return self::$instance;
        }

        try {
            if (DB_DRIVER === 'sqlite') {
                $dir = dirname(DB_SQLITE_PATH);
                if (!is_dir($dir)) {
                    @mkdir($dir, 0755, true);
                }
                $dsn = "sqlite:" . DB_SQLITE_PATH;
                $pdo = new PDO($dsn, null, null, [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false
                ]);
                $pdo->exec("PRAGMA foreign_keys = ON;");
            } else {
                $dsn = sprintf(
                    'mysql:host=%s;port=%s;dbname=%s;charset=%s',
                    DB_HOST,
                    DB_PORT,
                    DB_NAME,
                    DB_CHARSET
                );

                $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
                ]);
            }

            self::$instance = $pdo;
            return self::$instance;
        } catch (PDOException $e) {
            error_log("Veritabanı bağlantı hatası: " . $e->getMessage());
            throw new Exception("Veritabanı bağlantısı kurulamadı. Lütfen sunucu ayarlarını kontrol ediniz.");
        }
    }

    /**
     * Tek satır getiren yardımcı
     */
    public static function fetch(string $query, array $params = []): ?array {
        $stmt = self::connect()->prepare($query);
        $stmt->execute($params);
        $res = $stmt->fetch();
        return $res ?: null;
    }

    /**
     * Tüm satırları getiren yardımcı
     */
    public static function fetchAll(string $query, array $params = []): array {
        $stmt = self::connect()->prepare($query);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * INSERT / UPDATE / DELETE çalıştıran ve etkilenen satır sayısını dönen yardımcı
     */
    public static function execute(string $query, array $params = []): int {
        $stmt = self::connect()->prepare($query);
        $stmt->execute($params);
        return $stmt->rowCount();
    }

    /**
     * Son eklenen satır ID'sini dönen yardımcı
     */
    public static function lastInsertId(): string {
        return self::connect()->lastInsertId();
    }
}
