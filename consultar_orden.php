<?php
header('Content-Type: application/json');

$orderId = isset($_GET['id']) ? trim($_GET['id']) : '';

if (!$orderId) {
    http_response_code(400);
    echo json_encode(['error' => 'ID de orden no especificado']);
    exit;
}

$accessToken = "APP_USR-4750157753324402-111515-b59373b1de4ab4850b4d49138de86054-154911477";

$ch = curl_init("https://api.mercadopago.com/v1/orders/" . urlencode($orderId));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer " . $accessToken,
    "Content-Type: application/json"
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

http_response_code($httpCode ?: 200);
echo $response;
?>
