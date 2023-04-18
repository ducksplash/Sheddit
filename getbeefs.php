<?php

require_once('./database_connection.php');

// set fallback vars
$topictitle = 'main';

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


// get topic list

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

    $result = $stmt->get_result();

    $data = array();

    // Convert date strings to timestamps and formats
    while ($row = $result->fetch_assoc()) {
        $timestamp = strtotime($row['newest_date']);
        $date_format = date("F jS, Y", $timestamp);
        $row['lastpost'] = $date_format;
        $row['title'] = htmlspecialchars(make_valid_string($row['title']));
        $data[] = $row;
    }

    $stmt->close();
}



// get list of posts in given topic

if ($get_type === 'post')
{
    // get posts for this topic id:
    
    // if none specified, default to the 'welcome' board (at ID 1)
    $topic_id = (isset($_GET['topic_id'])) ? (int)$_GET['topic_id'] : 1;
    
    // try to get topic name and pass it in a var
    $topicquery = "SELECT * FROM topics WHERE id=? LIMIT 1";
    $topicstmt = mysqli_prepare($database_connection, $topicquery);
    mysqli_stmt_bind_param($topicstmt, "i", $topic_id);
    mysqli_stmt_execute($topicstmt);
    $topicresult = mysqli_stmt_get_result($topicstmt);
    $topicrow = mysqli_fetch_assoc($topicresult);
    $topicstmt->close();

    $topictitle = htmlspecialchars($topicrow['title'], ENT_QUOTES);
    
    // still need to finish query to add limit, start, sort...
    $query = "SELECT * FROM items WHERE tid=? AND lineage='post' ORDER BY reputation DESC";
    $stmt = mysqli_prepare($database_connection, $query);
    mysqli_stmt_bind_param($stmt, "i", $topic_id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $stmt->close();

    $topiccounter = 0;
    while ($row = mysqli_fetch_assoc($result)) 
    {
        // while we're here, let's count how many posts are in this topic

        $post_id = (isset($row['id'])) ? (int)$row['id'] : (int)0;
        $owner_id = (isset($row['ownerID'])) ? (int)$row['ownerID'] : (int)0;

        // Prepare the SQL statement
        // SQL query
        $sql = "SELECT COUNT(*) FROM items WHERE pid = ? AND lineage = 'reply'";

        $stmt = $database_connection->prepare($sql);

        $stmt->bind_param('i', $post_id);

        $stmt->execute();

        $stmt->bind_result($count);

        $stmt->fetch();

        $stmt->close();

        $zquery = "SELECT userlevel FROM users WHERE id=?";
        $zstmt = mysqli_prepare($database_connection, $zquery);
        mysqli_stmt_bind_param($zstmt, "i", $owner_id);
        mysqli_stmt_execute($zstmt);
        $zresult = mysqli_stmt_get_result($zstmt);
        $zstmt->close();
        $zrow = mysqli_fetch_assoc($zresult);

        $row['deleted'] = ($row['date_deleted'] === '0000-00-00 00:00:00') ? 'false' : 'true';

        $row['userlevel'] = $zrow['userlevel'];

        $row['replies'] = $count;

        $row['topic'] = $topictitle;

        $row['title'] = ($row['deleted'] === 'false') ? htmlspecialchars($row['title'], ENT_QUOTES) : 'Deleted';

        $row['body'] = ($row['deleted'] === 'false') ? htmlspecialchars($row['body'], ENT_QUOTES) : 'Deleted';

        $data[] = $row;
    }
//    die();
}



// get individual post with replies

if ($get_type === 'thread')
{
    // get thread and replies
    // if none specified, kick user back to topics list
    $post_id = (isset($_GET['post_id'])) ? (int)$_GET['post_id'] : 0;
    
    if ($post_id === 0)
    {
        $data['error'] = 'no post ID';
    }
    else
    {
        $threadquery = "SELECT * FROM items WHERE id=? AND lineage='post' ORDER BY date_created DESC LIMIT 1";
        $stmt = mysqli_prepare($database_connection, $threadquery);
        mysqli_stmt_bind_param($stmt, 'i', $post_id);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        $stmt->close();
        $threadrow = mysqli_fetch_assoc($result);
    
        $ownerID = $threadrow['ownerID'];
        $data['id'] = $threadrow['id'];
        $data['deleted'] = ($threadrow['date_deleted'] === '0000-00-00 00:00:00') ? 'false' : 'true';
        $data['threadtitle'] = ($data['deleted'] === 'false') ? htmlspecialchars($threadrow['title'], ENT_QUOTES, 'UTF-8') : 'Deleted';
        $data['threadbody'] = ($data['deleted'] === 'false') ? nl2br(htmlspecialchars($threadrow['body'], ENT_QUOTES, 'UTF-8')) : 'Deleted';
        $data['threadtype'] = $threadrow['item_type'];
        $data['threadusername'] = $threadrow['username'];
        // $data['threaduserlevel'] = $threadrow['userlevel'];
        $data['extension'] = $threadrow['extension'];
        $data['reputation'] = $threadrow['reputation'];
        $data['date_created'] = $threadrow['date_created'];
        $data['date_modified'] = $threadrow['date_modified'];

        $zquery = "SELECT userlevel FROM users WHERE id=?";
        $zstmt = mysqli_prepare($database_connection, $zquery);
        mysqli_stmt_bind_param($zstmt, "i", $ownerID);
        mysqli_stmt_execute($zstmt);
        $zresult = mysqli_stmt_get_result($zstmt);
        $zstmt->close();
        $zrow = mysqli_fetch_assoc($zresult);

        $data['userlevel'] = $zrow['userlevel'];


        $replydata = [];
    
        $repliesquery = "SELECT * FROM items WHERE pid=? AND lineage='reply' ORDER BY reputation DESC";
        $stmt = mysqli_prepare($database_connection, $repliesquery);
        mysqli_stmt_bind_param($stmt, 'i', $post_id);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        $stmt->close();

        while ($row = mysqli_fetch_assoc($result)) 
        {


            $zquery = "SELECT userlevel FROM users WHERE id=?";
            $zstmt = mysqli_prepare($database_connection, $zquery);
            mysqli_stmt_bind_param($zstmt, "i", $row['ownerID']);
            mysqli_stmt_execute($zstmt);
            $zresult = mysqli_stmt_get_result($zstmt);
            $zstmt->close();
            $zrow = mysqli_fetch_assoc($zresult);
    
            $row['userlevel'] = $zrow['userlevel'];
            $row['deleted'] = ($row['date_deleted'] === '0000-00-00 00:00:00') ? 'false' : 'true';

    

            $row['title'] = ($row['deleted'] === 'false') ? htmlspecialchars($row['title'], ENT_QUOTES, 'UTF-8') : 'Deleted';
            $row['body'] = ($row['deleted'] === 'false') ? nl2br(htmlspecialchars($row['body'], ENT_QUOTES, 'UTF-8')) : 'Deleted';
            $replydata[] = $row;
        }
    
        $data['replies'] = $replydata;
    }
    
}



    


// return data 
$json = json_encode($data);
header('Content-Type: application/json');
echo $json;

// fin




// helper functions
  // clean string
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
