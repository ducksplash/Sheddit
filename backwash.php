<?php

include('./dababase_connection.php');

//echo "Connected successfully";

////////////////////////////////////////////////////////


$post_type = (isset($_POST['post_type'])) ? (int)$_POST['post_type'] : 0;
$title_string = (isset($_POST['post_title'])) ? make_valid_string($_POST['post_title']) : '';
$topic_id = (isset($_POST['post_topic'])) ? $_POST['post_topic'] : 0;
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

      $post_result = insert_post($database_connection, $ownerID, $title_string, $post_string, $topic_id);
      
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

  function insert_post($dbc, $ownerID, $title, $body, $tid) 
  {
      // Escape the values to prevent SQL injection
      $ownerID = mysqli_real_escape_string($dbc, $ownerID);
      $title = mysqli_real_escape_string($dbc, $title);
      $body = mysqli_real_escape_string($dbc, $body);
  
      $title_trimmed = (strlen($title) > 99) ? substr($title, 0, 100) : $title;
      $body_trimmed = (strlen($body) > 999) ? substr($body, 0, 1000) : $body;
  
      // Construct the SQL query to check if the item already exists
      $sql_check = "SELECT id FROM items WHERE title='$title_trimmed' AND body='$body_trimmed' LIMIT 1";
  
      // Execute the SQL query
      $result = mysqli_query($dbc, $sql_check);
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
            // Construct the SQL query to insert the new item
            $sql_insert = "INSERT INTO items (ownerID, title, body, date_created, date_modified, tid) 
            VALUES ('$ownerID', '$title_trimmed', '$body_trimmed', NOW(), NOW(), '$tid')";
    
            // Execute the SQL query
            if (mysqli_query($dbc, $sql_insert)) 
            {
                return "Post Saved";
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
      
      if ($extension !== "xxx")
      {
        // Construct the SQL query to check if the item already exists
        $sql_check = "SELECT id FROM items WHERE title='$title_trimmed' AND body='$filestring' LIMIT 1";
    
        // Execute the SQL query
        $result = mysqli_query($dbc, $sql_check);
        $row = mysqli_fetch_array($result);
    
        if (strlen($title_trimmed) > 0 && strlen($filestring) > 0)
        {
          if($row) 
          {
              // Item already exists, return false
              return "File Already Saved";
          } 
          else 
          {
              // Construct the SQL query to insert the new item
              $sql_insert = "INSERT INTO items (ownerID, item_type, title, body, extension, date_created, date_modified, tid) 
              VALUES ('$ownerID', 2, '$title_trimmed', '$filestring', '$extension', NOW(), NOW(), '$tid')";
      
              // Execute the SQL query
              if (mysqli_query($dbc, $sql_insert)) 
              {
                  return "File Saved";
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
      else
      {
        return "File type invalid";
      }
  }
  


  // insert link post

  function insert_link($dbc, $ownerID, $title, $linkurl, $tid) 
  {
      // Escape the values to prevent SQL injection
      $ownerID = mysqli_real_escape_string($dbc, $ownerID);
      $title = mysqli_real_escape_string($dbc, $title);
      $linkurl = mysqli_real_escape_string($dbc, $linkurl);

      // check and amend URL
      if (!preg_match("~^(?:f|ht)tps?://~i", $linkurl)) {
          $linkurl = "https://" . $linkurl;
      }


  
      $title_trimmed = (strlen($title) > 100) ? substr($title, 0, 100) : $title;
      $linkurl_trimmed = (strlen($linkurl) > 200) ? substr($linkurl, 0, 200) : $linkurl;
  
      // Construct the SQL query to check if the item already exists
      $sql_check = "SELECT id FROM items WHERE title='$title_trimmed' AND body='$linkurl_trimmed' LIMIT 1";
  
      // Execute the SQL query
      $result = mysqli_query($dbc, $sql_check);
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
            VALUES ('$ownerID', 1, '$title_trimmed', '$linkurl_trimmed', NOW(), NOW(), '$tid')";
    
            // Execute the SQL query
            if (mysqli_query($dbc, $sql_insert)) 
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
