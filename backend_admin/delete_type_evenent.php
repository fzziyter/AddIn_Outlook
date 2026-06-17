<?php
if (!defined('NOCSRFCHECK')) define('NOCSRFCHECK', 1);

ob_start();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    exit;
}

include "db.php";

$input = file_get_contents("php://input");
$data = json_decode($input, true);

if (!$data || empty($data['code'])) {
    ob_end_clean();
    echo json_encode(["success" => false, "error" => "Code d'événement manquant."]);
    exit;
}

try {
    $stmt = $conn->prepare("DELETE FROM dolibarr_event_types WHERE code = :code");
    $stmt->execute([':code' => $data['code']]);

    ob_end_clean();
    echo json_encode([
        "success" => true,
        "message" => "Type d'événement supprimé avec succès."
    ]);

} catch (Exception $e) {
    if (ob_get_length()) ob_end_clean();
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}
?>