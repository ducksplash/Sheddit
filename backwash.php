<?php

require_once('./database_connection.php');

//echo "Connected successfully";

////////////////////////////////////////////////////////


$post_type = (isset($_POST['post_type'])) ? (int)$_POST['post_type'] : 0;
$title_string = (isset($_POST['post_title'])) ? make_valid_string($_POST['post_title']) : '';
$topic_id = (isset($_POST['post_topic'])) ? $_POST['post_topic'] : 0;
$post_id = (isset($_POST['post_ID'])) ? $_POST['post_ID'] : 0;
$post_string = (isset($_POST['post_body'])) ? make_valid_string($_POST['post_body']) : '';
$link_string = (isset($_POST['post_link'])) ? make_valid_string($_POST['post_link']) : '';
$file_string = (isset($_POST['file_body'])) ? make_valid_string($_POST['file_body']) : '';

//print($file_string);
//die();

    
    // Define the owner ID when accounts exist, use placeholders for now
    $ownerID = 1;



    // post basic text post
    if ($post_type === 0 || $post_type == "")
    {

      $post_result = insert_post($database_connection, $ownerID, $title_string, $post_string, $topic_id, $post_id);
      
    } 

    // post a link
    if ($post_type === 1)
    {

      $post_result = insert_link($database_connection, $ownerID, $title_string, $link_string, $topic_id);
      
    } 

    // post a file
    if ($post_type === 2)
    {

      $post_result = insert_file($database_connection, $ownerID, $title_string, $file_string, $topic_id);
      
    } 





  // output  
  echo json_encode($post_result);
  exit();








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



  // insert text post

  function insert_post($dbc, $ownerID, $title, $body, $tid, $pid) 
  {
      // Prepare the SQL statement with placeholders
      $sql_check = "SELECT id FROM items WHERE title=? AND body=? LIMIT 1";
      $sql_insert = "INSERT INTO items (ownerID, title, body, lineage, pid, date_created, date_modified, tid) VALUES (?, ?, ?, ?, ?, NOW(), NOW(), ?)";
    
      if ($pid > 0)
      {
          $postlineage = 'reply';
          $sql_title = "SELECT title FROM items WHERE id=? LIMIT 1";
          $stmt_title = mysqli_prepare($dbc, $sql_title);
          mysqli_stmt_bind_param($stmt_title, 'i', $pid);
          mysqli_stmt_execute($stmt_title);
          $title_result = mysqli_stmt_get_result($stmt_title);
          $titlerow = mysqli_fetch_array($title_result);
  
          $title = $titlerow['title'];
      }
      else
      {
          $postlineage = 'post';
      }
  
      // Prepare the statement
      $stmt_check = mysqli_prepare($dbc, $sql_check);
      $stmt_insert = mysqli_prepare($dbc, $sql_insert);
    
      // Bind parameters to the statement
      mysqli_stmt_bind_param($stmt_check, 'ss', $title_trimmed, $body_trimmed);
      mysqli_stmt_bind_param($stmt_insert, 'isssii', $ownerID, $title, $body, $postlineage, $pid, $tid);
    
      // Escape the values to prevent SQL injection
      $ownerID = mysqli_real_escape_string($dbc, $ownerID);
      $title_trimmed = (strlen($title) > 99) ? substr($title, 0, 100) : $title;
      $body_trimmed = (strlen($body) > 999) ? substr($body, 0, 1000) : $body;
    
      // Execute the statement to check if the item already exists
      mysqli_stmt_execute($stmt_check);
      $result = mysqli_stmt_get_result($stmt_check);
      $row = mysqli_fetch_array($result);
    
      if (strlen($title_trimmed) > 0 && strlen($body_trimmed) > 0)
      {
          if($row) 
          {
              // Item already exists, return false
              return "Post Already Saved";
          } 
          else 
          {
              // Execute the statement to insert the new item
              if (mysqli_stmt_execute($stmt_insert)) 
              {
                  if ($postlineage === 'reply')
                  {
                    return $dbc->insert_id;
                  }
                  else
                  {
                    return "Post Saved";
                  }
              } 
              else 
              {
                  return "An Error Occured [1]";
              }
          }
      }
      else
      {
          return "All fields must be filled";
      }
    
      // Close the statements
      mysqli_stmt_close($stmt_check);
      mysqli_stmt_close($stmt_insert);
  }
    
  

  // insert file post

  function insert_file($dbc, $ownerID, $title, $filestring, $tid) 
  {
      // Escape the values to prevent SQL injection
      $ownerID = mysqli_real_escape_string($dbc, $ownerID);
      $title = mysqli_real_escape_string($dbc, $title);
      $filestring = mysqli_real_escape_string($dbc, $filestring);
  
      $title_trimmed = (strlen($title) > 99) ? substr($title, 0, 100) : $title;
  
      // get file details
      $data_pos = strpos($filestring, ',');
      $data = substr($filestring, $data_pos);

      // decode the base64 data
      $image_data = base64_decode($data);

      // get the MIME type of the image
      $finfo = finfo_open(FILEINFO_MIME_TYPE);
      $mime_type = finfo_buffer($finfo, $image_data);

      // map the MIME type to the file extension
      $extension = '';
      switch ($mime_type) {
          case 'image/jpeg':
              $extension = 'jpg';
              break;
          case 'image/png':
              $extension = 'png';
              break;
          case 'image/gif':
              $extension = 'gif';
              break;
          default:
            $extension = 'xxx';
            break;
      }

      // print($extension);
      // print($mime_type);
      // die();
      
      if ($extension !== "xxx") {
        // Construct the SQL query to check if the item already exists
        $sql_check = "SELECT id FROM items WHERE title=? AND body=? LIMIT 1";
    
        // Prepare the statement
        $stmt = mysqli_prepare($dbc, $sql_check);
    
        // Bind the parameters
        mysqli_stmt_bind_param($stmt, "ss", $title_trimmed, $filestring);
    
        // Execute the statement
        mysqli_stmt_execute($stmt);
    
        // Get the result
        mysqli_stmt_store_result($stmt);
        $row_count = mysqli_stmt_num_rows($stmt);
    
        if (strlen($title_trimmed) > 0 && strlen($filestring) > 0) {
            if ($row_count > 0) {
                // Item already exists, return false
                return "File Already Saved";
            } else {
                // Construct the SQL query to insert the new item
                $sql_insert = "INSERT INTO items (ownerID, item_type, title, body, extension, date_created, date_modified, tid) VALUES (?, 2, ?, ?, ?, NOW(), NOW(), ?)";
    
                // Prepare the statement
                $stmt = mysqli_prepare($dbc, $sql_insert);
    
                // Bind the parameters
                mysqli_stmt_bind_param($stmt, "isssi", $ownerID, $title_trimmed, $filestring, $extension, $tid);
    
                // Execute the statement
                if (mysqli_stmt_execute($stmt)) {
                    return "File Saved";
                } else {
                    return "An Error Occured [1]";
                }
            }
        } else {
            return "All fields must be filled";
        }
    } else {
        return "File type invalid";
    }
    
  }
  


  // insert link post

  function insert_link($dbc, $ownerID, $title, $linkurl, $tid) 
  {
      // check and amend URL
      if (!preg_match("~^(?:f|ht)tps?://~i", $linkurl)) {
          $linkurl = "https://" . $linkurl;
      }
  
      $title_trimmed = (strlen($title) > 100) ? substr($title, 0, 100) : $title;
      $linkurl_trimmed = (strlen($linkurl) > 200) ? substr($linkurl, 0, 200) : $linkurl;
    
      // Construct the SQL query to check if the item already exists
      $sql_check = "SELECT id FROM items WHERE title=? AND body=? LIMIT 1";
      
      // Prepare the SQL query
      $stmt = mysqli_prepare($dbc, $sql_check);
      
      // Bind parameters to the prepared statement
      mysqli_stmt_bind_param($stmt, "ss", $title_trimmed, $linkurl_trimmed);
      
      // Execute the prepared statement
      mysqli_stmt_execute($stmt);
      
      // Get the result set from the prepared statement
      $result = mysqli_stmt_get_result($stmt);
      $row = mysqli_fetch_array($result);
      
      if (strlen($title_trimmed) > 0 && strlen($linkurl_trimmed) > 0)
      {
          if($row) 
          {
              // Item already exists, return false
              return "Link Already Saved";
          } 
          else 
          {
              // Construct the SQL query to insert the new item
              $sql_insert = "INSERT INTO items (ownerID, item_type, title, body, date_created, date_modified, tid) 
                             VALUES (?, 1, ?, ?, NOW(), NOW(), ?)";
      
              // Prepare the SQL query
              $stmt = mysqli_prepare($dbc, $sql_insert);
      
              // Bind parameters to the prepared statement
              mysqli_stmt_bind_param($stmt, "sssi", $ownerID, $title_trimmed, $linkurl_trimmed, $tid);
      
              // Execute the prepared statement
              if (mysqli_stmt_execute($stmt)) 
              {
                  return "Link Saved";
              } 
              else 
              {
                  return "An Error Occured [1]";
              }
          }
      }
      else
      {
          return "All fields must be filled";
      }
  }
  
  

?>
