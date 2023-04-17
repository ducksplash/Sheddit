<?php
require_once('./database_connection.php');

$imid = isset($_GET['imid']) ? intval($_GET['imid']) : 0;


// Prepare and execute SQL statement to count number of reps
$stmt = $database_connection->prepare("SELECT body FROM items WHERE id = ?");
$stmt->bind_param("i", $imid);
$stmt->execute();
$stmt->bind_result($imgbody);
$stmt->fetch();
$stmt->close();

// decode the base64 data
$image_data = base64_decode($imgbody);

// get the MIME type of the image
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime_type = finfo_buffer($finfo, $image_data);

header('Content-Type: ' . $mime_type);
echo $image_data;
    
?>
