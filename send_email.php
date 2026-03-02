<?php
// send_email.php

// --- Helpers ---
function clean_text($v) {
  $v = trim((string)$v);
  // прибираємо керуючі символи
  $v = preg_replace('/[\x00-\x1F\x7F]/u', '', $v);
  return $v;
}

function too_many_links($text, $maxLinks = 3) {
  preg_match_all('/https?:\/\/|www\./i', $text, $m);
  return count($m[0]) > $maxLinks;
}

// --- Basic request check ---
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
  http_response_code(405);
  echo "Wrong request";
  exit;
}

// --- Anti-spam level 1 ---

// 1) Honeypot (боти люблять заповнювати всі поля)
$honeypot = clean_text($_POST['website'] ?? '');
if ($honeypot !== '') {
  http_response_code(200); // спеціально 200, щоб не давати ботам сигнал
  echo "OK";
  exit;
}

// 2) Мінімальний час заповнення (людина не заповнює форму за 0.3с)
$formTs = (int)($_POST['form_ts'] ?? 0);
$nowMs  = (int)round(microtime(true) * 1000);
if ($formTs > 0) {
  $elapsedMs = $nowMs - $formTs;
  if ($elapsedMs < 2500) { // < 2.5 сек підозріло
    http_response_code(429);
    echo "Too fast";
    exit;
  }
}

// 3) Простий rate-limit по IP (файл-лімітер на 60 сек)
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$ipKey = preg_replace('/[^a-zA-Z0-9_.-]/', '_', $ip);
$rateFile = sys_get_temp_dir() . "/contact_rate_" . $ipKey;

$limitSeconds = 60;
$maxPerWindow = 3;

$events = [];
if (file_exists($rateFile)) {
  $raw = file_get_contents($rateFile);
  $events = json_decode($raw, true);
  if (!is_array($events)) $events = [];
}
$cutoff = time() - $limitSeconds;
$events = array_values(array_filter($events, fn($t) => is_int($t) && $t >= $cutoff));

if (count($events) >= $maxPerWindow) {
  http_response_code(429);
  echo "Too many requests";
  exit;
}
$events[] = time();
file_put_contents($rateFile, json_encode($events), LOCK_EX);

// --- Read & sanitize fields ---
$name    = clean_text($_POST['user-name-contact'] ?? '');
$email   = clean_text($_POST['user-email-contact'] ?? '');
$phone   = clean_text($_POST['user-tel-full'] ?? ($_POST['user-tel-contact'] ?? ''));
$message = clean_text($_POST['user-message-contact'] ?? '');

// 4) Мінімальні sanity checks
if ($name === '' || $email === '') {
  http_response_code(400);
  echo "Missing required fields";
  exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo "Wrong email format";
  exit;
}

// 5) Евристики проти спаму (не жорстко)
$combined = $name . " " . $email . " " . $phone . " " . $message;

// забагато посилань — підозріло
if ($message !== '' && too_many_links($message, 3)) {
  http_response_code(400);
  echo "Message looks like spam";
  exit;
}

// дуже довгі поля — підозріло
if (mb_strlen($combined, 'UTF-8') > 3000) {
  http_response_code(400);
  echo "Message too long";
  exit;
}

// --- Prepare email ---
$to = "mishafort228@gmail.com"; // TODO: заміниш на доменну пошту
$subject = "New message from " . $name;

// захист від header injection
$subject = str_replace(["\r", "\n"], ' ', $subject);
$emailSafe = str_replace(["\r", "\n"], '', $email);

$body = "Name: $name\nEmail: $email\n";
if ($phone !== '') $body .= "Phone: $phone\n";
if ($message !== '') $body .= "Message: $message\n";

// headers
$headers = "From: no-reply@your-domain.com\r\n";
$headers .= "Reply-To: $emailSafe\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

if (mail($to, $subject, $body, $headers)) {
  echo "Your message has been sent successfully.";
} else {
  http_response_code(500);
  echo "Failed to send message.";
}