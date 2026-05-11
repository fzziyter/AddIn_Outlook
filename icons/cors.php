<?php
// ─────────────────────────────────────────────────────────
//  icons/cors.php
//  Sert les fichiers du dossier icons/ avec headers CORS.
//  Compatible Apache, XAMPP, et php -S (aucune config serveur
//  nécessaire, pas de dépendance à mod_headers ou .htaccess)
//
//  Usage : /icons/cors.php?file=tag.svg
//          /icons/cors.php?file=icons.json
// ─────────────────────────────────────────────────────────

// ── Headers CORS (toujours en premier) ───────────────────
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Répondre aux preflight OPTIONS immédiatement
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Validation du paramètre ?file= ───────────────────────
$file = $_GET['file'] ?? '';

if (empty($file)) {
    http_response_code(400);
    echo json_encode(['error' => 'Paramètre ?file= manquant']);
    exit;
}

// Sécurité : empêcher la traversée de dossiers (../../etc/passwd)
$file     = basename($file);                        // supprime tout chemin
$filePath = __DIR__ . DIRECTORY_SEPARATOR . $file;  // chemin absolu dans icons/

if (!file_exists($filePath) || is_dir($filePath)) {
    http_response_code(404);
    echo json_encode(['error' => "Fichier '$file' introuvable"]);
    exit;
}

// ── Content-Type selon l'extension ───────────────────────
$ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));

$mimeTypes = [
    'svg'  => 'image/svg+xml',
    'png'  => 'image/png',
    'jpg'  => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'webp' => 'image/webp',
    'json' => 'application/json; charset=utf-8',
];

if (!array_key_exists($ext, $mimeTypes)) {
    http_response_code(403);
    echo json_encode(['error' => "Extension '.$ext' non autorisée"]);
    exit;
}

header('Content-Type: ' . $mimeTypes[$ext]);

// ── Cache ─────────────────────────────────────────────────
if ($ext === 'json') {
    header('Cache-Control: public, max-age=300');    // 5 min pour le catalogue
} else {
    header('Cache-Control: public, max-age=86400');  // 24h pour les icônes
}

// ── Envoi du fichier ──────────────────────────────────────
readfile($filePath);
exit;