<?php

$error_list = [];

// Connect To Database
$servername = "localhost:3308";
$username = "rootfood";
$password = "sausages777";
$database_name = "loblette";

// Create connection
$database_connection = new mysqli($servername, $username, $password);

// Check connection
if ($database_connection->connect_error) 
{
  $error_list += "Database Connection Error";
}

// select database
mysqli_select_db($database_connection, $database_name);

?>
