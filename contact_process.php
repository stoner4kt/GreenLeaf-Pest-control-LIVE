<?php
// 1. Set the recipient email (Your Client's Email)
$to = "info@greenleafpestcontrol.co.za"; 
$subject = "New Quote Request from GreenLeaf Website";

// 2. Get and clean the data [cite: 3, 4, 6]
$name = trim($_POST['name']);
$email = trim($_POST['email']);
$phone = trim($_POST['phone']);
$address = trim($_POST['address']);
$service = isset($_POST['service']) ? implode(", ", $_POST['service']) : 'None Selected';
$date = $_POST['service_date'];
$time = $_POST['service_time'];
$message = trim($_POST['message']);

// 3. Construct the email body
$body = "You have received a new inquiry:\n\n";
$body .= "Name: $name\n";
$body .= "Email: $email\n";
$body .= "Phone: $phone\n";
$body .= "Address: $address\n";
$body .= "Service Requested: $service\n";
$body .= "Preferred Date/Time: $date at $time\n";
$body .= "Message:\n$message";

// 4. Set Email Headers (Crucial for deliverability)
$headers = "From: info@greenleafpestcontrol.co.za" . "\r\n";
$headers .= "Reply-To: $email" . "\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

// 5. Send the mail and check for success [cite: 9, 10]
if (mail($to, $subject, $body, $headers)) {
    header("Location: thank-you.html");
    exit();
} else {
    echo "Error: The server could not send the email. Please try again later.";
}
?>