<?php

include('./dababase_connection.php');

// get posts
////////////////////////////////////////////////////////


// let's set up a request type, so we can determine whether to serve topics, threads, or an indivudual thread

// types: 
// 'topic' for all forums list (default if request empty)
// 'post' for all posts in a forum
// 'thread' for a thread and it's replies 

$get_type = (isset($_GET['get_type'])) ? make_valid_string($_GET['get_type']) : 'topic';

// pass start for pagination, if empty set zero
$items_start = (isset($_GET['items_start'])) ? (int)$_GET['items_start'] : 0;

// pass limit for pagination, if empty set 20
$items_limit = (isset($_GET['items_limit'])) ? (int)$_GET['items_limit'] : 20;

//
$search_query = (isset($_GET['search_query'])) ? make_valid_string($_GET['search_query']) : '';

// returnable data
$data = [];

if ($get_type === 'topic')
{
    // Join topics and items tables and retrieve counts and date of most recent post
    $query = "SELECT t.*, COUNT(CASE WHEN i.lineage = 'post' THEN 1 END) AS posts, 
        COUNT(CASE WHEN i.lineage = 'reply' THEN 1 END) AS replies, 
        MAX(i.date_modified) AS newest_date
        FROM topics t 
        LEFT JOIN items i ON t.id = i.tid 
        GROUP BY t.id 
        ORDER BY t.id ASC";

    $stmt = $database_connection->prepare($query);

    $stmt->execute();

    $data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // Convert date strings to timestamps and formats
    foreach ($data as &$row) {
        $timestamp = strtotime($row['newest_date']);
        $date_format = date("F jS, Y", $timestamp);
        $row['lastpost'] = $date_format;
    }

    $stmt->close();
}

if ($get_type === 'post')
{
    // get posts for this topic id:
        // if none specified, default to the 'welcome' board (at ID 1)
    $topic_id = (isset($_GET['topic_id'])) ? (int)$_GET['topic_id'] : 1;
    
    
    // still need to finish query to add limit, start, sort...
    $query = "SELECT * FROM items WHERE tid=$topic_id AND lineage='post' ORDER BY id ASC";
    $result = mysqli_query($database_connection, $query);

    $topiccounter = 0;
    while ($row = mysqli_fetch_assoc($result)) 
    {
        // while we're here, let's count how many posts are in this topic

        $post_id = (isset($row['id'])) ? (int)$row['id'] : (int)0;
        // Prepare the SQL statement
        // SQL query
        $sql = "SELECT COUNT(*) FROM items WHERE pid = $post_id AND lineage = 'reply'";

        $stmt = $database_connection->prepare($sql);

        $stmt->execute();

        $stmt->bind_result($count);

        $stmt->fetch();

        $stmt->close();

        $row['replies'] = $count;

        $data[] = $row;
    }
//    die();
}


if ($get_type === 'thread')
{
    // get thread and replies
    // if none specified, kick user back to topics list
    $post_id = (isset($_GET['post_id'])) ? (int)$_GET['post_id'] : 0;
    // [do sql later]

    if ($post_id === 0)
    {
        // kick user back to topics page   
    }

}

$json = json_encode($data);

header('Content-Type: application/json');
echo $json;



  // clean
  function make_valid_string($dirtyString) 
  {
    // Remove any leading/trailing whitespace
    $cleanString = trim($dirtyString);
    
    // Escape any HTML tags
    $cleanString = htmlspecialchars($cleanString, ENT_QUOTES, 'UTF-8');
    
    // Escape any backticks, double quotes, and slashes
    $cleanString = str_replace(array('`', '"', '\\'), array('\`', '\"', '\\\\'), $cleanString);
    
    // Replace any apostrophes with a single quote to prevent SQL injection
    $cleanString = str_replace("'", "''", $cleanString);
    
    // Decode any HTML special characters
    $cleanString = htmlspecialchars_decode($cleanString, ENT_QUOTES);
    
    return $cleanString;
  }



?>
