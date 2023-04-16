<?php

require_once('./database_connection.php');

//echo "Connected successfully";

////////////////////////////////////////////////////////


$user_name = (isset($_POST['user_name'])) ? $_POST['user_name'] : '';
$pass_word = (isset($_POST['pass_word'])) ? $_POST['pass_word'] : '';
$pass_word_again = (isset($_POST['pass_word_again'])) ? $_POST['pass_word_again'] : '';
$email_address = (isset($_POST['email_address'])) ? $_POST['email_address'] : '';

$operation = (isset($_POST['operation'])) ? $_POST['operation'] : 'do nothing';



    // post basic text post
    if ($operation === "do nothing" || $operation == "")
    {

        // dunno yet, thinking maybe some sort of error message and a vague 'important' looking string
        // to needle the l337 h@X0rs for a bit while they follow the thread to nowhere :P
        
    } 



    // post basic text post
    if ($operation === "loginuser")
    {
            
        $userquery = "SELECT * FROM users WHERE username = ? ORDER BY id LIMIT 1";
        $userstmt = mysqli_prepare($database_connection, $userquery);
        mysqli_stmt_bind_param($userstmt, "s", $user_name);
        mysqli_stmt_execute($userstmt);
        $userresult = mysqli_stmt_get_result($userstmt);
        $userrow = mysqli_fetch_assoc($userresult);

        $stored_password = $userrow['password'];

        if (password_verify($pass_word, $stored_password)) 
        {
            
            // last login is now
            
            $logindate = gmdate('Y-m-d H:i:s');

            // salty
            $randy_salt = random_bytes(100);
            

            // sesh is hash of password hash plus date
            $session_id = password_hash($stored_password.$randy_salt, PASSWORD_BCRYPT);
            

            $stmt_sesh_set = $database_connection->prepare("UPDATE users SET sesh = ?, lastlogin = ? WHERE username = ?");
            $stmt_sesh_set->bind_param("sss", $session_id, $logindate, $user_name);
            $stmt_sesh_set->execute();

            
            setcookie('sesh', $session_id, [
                'expires' => time() + (86400 * 240),
                'path' => '/',
                'domain' => '',
                'secure' => true,
                'httponly' => true,
                'samesite' => 'Strict'
            ]);            

            echo "true";

        } 
        else 
        {    
            echo "false";
        }

    }     
    
    
    
    
    if ($operation === "logoutuser")
    {
          
        if (isset($_COOKIE["sesh"])) 
        {
            $currentsesh = $_COOKIE["sesh"];
            $newsesh = '';
            $stmt_sesh_set = $database_connection->prepare("UPDATE users SET sesh = ? WHERE sesh = ?");
            $stmt_sesh_set->bind_param("ss", $newsesh, $currentsesh);
            $stmt_sesh_set->execute();

            setcookie('sesh', $newsesh, [
                'expires' => time() - 3600,
                'path' => '/',
                'domain' => '',
                'secure' => true,
                'httponly' => true,
                'samesite' => 'Strict'
            ]);            

        } 
    } 

    ///////////////////

    if ($operation === "guicheck")
    {
        if (isset($_COOKIE["sesh"])) 
        {


            $userquery = "SELECT * FROM users WHERE sesh = ? ORDER BY id LIMIT 1";
            $userstmt = mysqli_prepare($database_connection, $userquery);
            mysqli_stmt_bind_param($userstmt, "s", $_COOKIE['sesh']);
            mysqli_stmt_execute($userstmt);
            $userresult = mysqli_stmt_get_result($userstmt);
            $userrow = mysqli_fetch_assoc($userresult);
    
            $stored_sesh = $userrow['sesh'];

            if (strlen($stored_sesh) > 0)
            {
                
                echo $userrow['username'];
            }
            else
            {
                echo "false";
            }
        } 
        else 
        {
            echo "false";
        }
    }



    // username check
    if ($operation === "namecheck")
    {
        
        $userquery = "SELECT * FROM users WHERE username = ? ORDER BY id LIMIT 1";
        $userstmt = mysqli_prepare($database_connection, $userquery);
        mysqli_stmt_bind_param($userstmt, "s", $user_name);
        mysqli_stmt_execute($userstmt);
        $userresult = mysqli_stmt_get_result($userstmt);
        $userrow = mysqli_fetch_assoc($userresult);

        $stored_sesh = $userrow['username'];

        if (strlen($stored_sesh) > 0)
        {
            echo 'taken';
        }
        else
        {
            echo "free";
        }
    
    }

    // post basic text post
    if ($operation === "createuser")
    {

        echo "meow";
        
    } 
    





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
