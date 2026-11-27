<?php
header('Content-Type: application/json');

// Recibe los datos enviados desde Antigravity / tu frontend
$input = json_decode(file_get_contents('php://input'), true);
$monto = isset($input['monto']) ? number_format((float)$input['monto'], 2, '.', '') : "0.00";
$referencia = isset($input['referencia']) ? $input['referencia'] : "ATOYAC-" . time();

$accessToken = "APP_USR-4750157753324402-111515-b59373b1de4ab4850b4d49138de86054-154911477";
$terminalId = isset($input['terminal_id']) && !empty(trim($input['terminal_id'])) ? trim($input['terminal_id']) : "NEWLAND_N950__N950NCC403258243";

$data = [
    "type" => "point",
    "external_reference" => $referencia,
    "transactions" => [
        "payments" => [
            [
                "amount" => $monto
            ]
        ]
    ],
    "config" => [
        "point" => [
            "terminal_id" => $terminalId
        ]
    ]
];

$ch = curl_init("https://api.mercadopago.com/v1/orders");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer " . $accessToken,
    "Content-Type: application/json",
    "X-Idempotency-Key: " . uniqid('atoyac_', true)
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>
