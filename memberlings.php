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
        echo "ELZ1769"; // lol
        
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
        $stored_salt = $userrow['salt'];
        $user_agent = $_SERVER['HTTP_USER_AGENT'];

        

        if (password_verify($stored_salt . $pass_word, $stored_password)) 
        {
            
            // last login is now
            
            $logindate = gmdate('Y-m-d H:i:s');

            // salty
            $randy_salt = random_bytes(100);
            

            // sesh is hash of password hash plus date
            $session_id = password_hash($stored_password.$randy_salt, PASSWORD_BCRYPT);
            

            $stmt_sesh_set = $database_connection->prepare("UPDATE users SET sesh = ?, user_agent = ?, lastlogin = ? WHERE username = ?");
            $stmt_sesh_set->bind_param("ssss", $session_id, $user_agent, $logindate, $user_name);
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
            $user_agent = $_SERVER['HTTP_USER_AGENT'];

            $userquery = "SELECT * FROM users WHERE sesh = ? ORDER BY id LIMIT 1";
            $userstmt = mysqli_prepare($database_connection, $userquery);
            mysqli_stmt_bind_param($userstmt, "s", $_COOKIE['sesh']);
            mysqli_stmt_execute($userstmt);
            $userresult = mysqli_stmt_get_result($userstmt);
            $userrow = mysqli_fetch_assoc($userresult);
    
            $stored_sesh = $userrow['sesh'];
            $stored_user_agent = $userrow['user_agent'];

            $userstmt->close();


            if (strlen($stored_sesh) > 0)
            {
                if ($stored_user_agent === $user_agent)
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
        else 
        {
            echo "false";
        }
    }



    // post basic text post
    if ($operation === "createuser")
    {
        // check username is valid
        if (!preg_match('/^[a-zA-Z0-9_]{6,}$/', $user_name)) 
        {
            echo "false";
            exit;
        }

        // check password is complex enough
        if (strlen($pass_word) < 8 || !preg_match('/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+{}\[\]:;\'"\\\\|,<.>\/?`~\-])[a-zA-Z0-9!@#$%^&*()_+{}\[\]:;\'"\\\\|,<.>\/?`~\-£]{8,}$/', $pass_word))
        {
            echo "false";
            exit;
        }

        // check password confirmation matches
        if ($pass_word != $pass_word_again)
        {
            echo "false";
            exit;
        }

        // check email address is valid
        if (!filter_var($email_address, FILTER_VALIDATE_EMAIL))
        {
            echo "false";
            exit;
        }

        // check if username already exists
        $xsql_select = "SELECT COUNT(*) FROM users WHERE username = ?";
        $xstmt = mysqli_prepare($database_connection, $xsql_select);
        mysqli_stmt_bind_param($xstmt, "s", $user_name);
        mysqli_stmt_execute($xstmt);
        mysqli_stmt_bind_result($xstmt, $xcount);
        mysqli_stmt_fetch($xstmt);

        if ($xcount > 0) 
        {
            echo "false"; // username already exists
            exit;
        }
        $xstmt->close();

        // hash the password
        $salt = bin2hex(random_bytes(16));
        $hashed_password = password_hash($salt . $pass_word, PASSWORD_BCRYPT);
        $user_agent = $_SERVER['HTTP_USER_AGENT'];

        // insert the new user
        $sql_insert = "INSERT INTO users (username, password, salt, email, user_agent) 
                    VALUES (?, ?, ?, ?)";
    
        // Prepare the SQL query
        $stmt = mysqli_prepare($database_connection, $sql_insert);
    
        // Bind parameters to the prepared statement
        mysqli_stmt_bind_param($stmt, "sssss", $user_name, $hashed_password, $salt, $email_address, $user_agent);
    
        // Execute the prepared statement
        if (mysqli_stmt_execute($stmt)) 
        {
            // account created
            echo "true";
        } 
        else 
        {
            if (mysqli_errno($database_connection) == 1062)
            {
                echo "false"; // username already exists
            }
            else
            {
                echo "false"; // other database error
            }
        }
        $stmt->close();

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
