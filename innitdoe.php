<?php
require_once('./database_connection.php');

$sid = 0;

// Prepare and execute SQL statement to count number of reps
$stmt = $database_connection->prepare("SELECT site_title FROM sitesettings WHERE id = ?");
$stmt->bind_param("i", $sid);
$stmt->execute();
$stmt->bind_result($sitetitle);
$stmt->fetch();
$stmt->close();

print($sitetitle);

?>
