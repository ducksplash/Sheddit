<?php
// check if user logged in
$loggedin = false;
$cookie_username = '';

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
    $ownerID = $userrow['id'];
    $userlevel = $userrow['userlevel'];

    $userstmt->close();

    if (strlen($stored_sesh) > 0)
    {
        // this makes stealing cookies more awkward, but still not impossible
        if ($user_agent === $stored_user_agent)
        {    
            if ($userlevel > -1)
            {
                $cookie_username = $userrow['username'];
                $loggedin = true;
            }
            else
            {
                // user is banned
                $loggedin = false;                
            }

        }
        else
        {
            $loggedin = false;
        }
    }
    else
    {
        $loggedin = false;
    }
} 
else 
{
    $loggedin = false;
}
?>
