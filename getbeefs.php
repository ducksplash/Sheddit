<?php

include('./dababase_connection.php');

// get posts
////////////////////////////////////////////////////////


$post_id = (isset($_POST['post_id'])) ? (int)$_POST['post_id'] : 0;
$topic_id = (isset($_POST['topic_id'])) ? make_valid_string($_POST['topic_id']) : '';
$items_start = (isset($_POST['items_start'])) ? make_valid_string($_POST['items_start']) : '';
$items_limit = (isset($_POST['items_limit'])) ? make_valid_string($_POST['items_limit']) : '';
$search_query = (isset($_POST['search_query'])) ? make_valid_string($_POST['search_query']) : '';

//print($file_string);
//die();

$query = "SELECT * FROM items ORDER BY date_modified DESC";
$result = mysqli_query($database_connection, $query);
$rowset = mysqli_fetch_all($result, MYSQLI_ASSOC);


print_r($rowset);


?>
