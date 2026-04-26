<?php
// backend_AddIn/tiers/checkTiersByDomain.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include(__DIR__ . "/../../backend_admin/db.php"); 

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

$session_token = $data["session_token"] ?? null;
$sender_email  = $data["sender_email"]  ?? null;

// 1. Validate input format
if (!$session_token || !$sender_email || !strpos($sender_email, "@")) {
    echo json_encode(["status" => "success", "found" => false, "message" => "Format invalide"]);
    exit;
}

// 2. Fetch Client Credentials
$stmt = $conn->prepare("SELECT dolibarr_url, dolibarr_api_key FROM clients WHERE session_token = ?");
$stmt->execute([$session_token]);
$client = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$client) {
    echo json_encode(["status" => "error", "message" => "Session invalide"]);
    exit;
}

// 3. Extract Domain and check for Public Domains
$domain = substr(strrchr($sender_email, "@"), 1);
$public_domains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.fr', 'icloud.com', 'outlook.fr', 'gmaijl.com']; // Added your typo for testing

if (in_array(strtolower($domain), $public_domains)) {
    $filter = "(email:equals:'$sender_email')";
} else {
    $filter = "(email:equals:'$sender_email')OR(url:like:'%$domain%')";
}

// 4. API Request
$apiUrl = rtrim($client['dolibarr_url'], '/') . "/api/index.php/thirdparties";
$finalUrl = $apiUrl . "?filter=" . urlencode($filter) . "&limit=1";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $finalUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["DOLAPIKEY: " . $client['dolibarr_api_key']]);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$result = json_decode($response, true);

// 5. THE CRITICAL FIX: Strict Verification
if ($httpCode === 200 && is_array($result) && count($result) > 0) {
    $match = $result[0];
    $match_email = strtolower($match['email'] ?? '');
    $match_url   = strtolower($match['url'] ?? '');
    $search_email = strtolower($sender_email);
    
    $found_by_email  = ($match_email === $search_email);
    $found_by_domain = (!empty($match_url) && strpos($match_url, $domain) !== false);

    // Only return TRUE if there is a REAL match
    if ($found_by_email || $found_by_domain) {
        echo json_encode([
            "status" => "success",
            "found" => true,
            "name" => $match['name'],
            "id" => $match['id'],
            "matched_via" => $found_by_email ? "email" : "domain"
        ]);
    } else {
        // This was a false positive from Dolibarr's broad search
        echo json_encode(["status" => "success", "found" => false, "reason" => "false_positive"]);
    }
} else {
    echo json_encode(["status" => "success", "found" => false]);
}