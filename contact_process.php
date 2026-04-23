<?php
$to = "info@greenleafpestcontrol.co.za";
$subject = "New Booking Request from GreenLeaf Website";

$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$service = trim($_POST['service'] ?? '');
$date = trim($_POST['service_date'] ?? '');
$time = trim($_POST['service_time'] ?? '');
$privacyAccepted = isset($_POST['privacy']);

if (!$name || !$email || !$phone || !$service || !$date || !$time || !$privacyAccepted) {
    http_response_code(400);
    echo "Error: Please complete all required fields.";
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo "Error: Please provide a valid email address.";
    exit();
}

$body = "You have received a new booking request:\n\n";
$body .= "Name: $name\n";
$body .= "Email: $email\n";
$body .= "Phone: $phone\n";
$body .= "Service Requested: $service\n";
$body .= "Preferred Date: $date\n";
$body .= "Preferred Time: $time\n";

$headers = "From: info@greenleafpestcontrol.co.za" . "\r\n";
$headers .= "Reply-To: $email" . "\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

if (mail($to, $subject, $body, $headers)) {
    header("Location: thank-you.html");
    exit();
}

http_response_code(500);
echo "Error: The server could not send the email. Please try again later.";
?>
