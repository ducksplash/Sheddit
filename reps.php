<?php
require_once('./database_connection.php');
include('./lc.php');


$item_id = isset($_GET['item_id']) ? intval($_GET['item_id']) : 0;
$rep = isset($_GET['rep_value']) ? $_GET['rep_value'] : 'down';

$rep_val = $rep === 'up' ? 'up' : 'down';

// Get reputation of item
$q_rep_start = "SELECT reputation FROM items WHERE id = ? LIMIT 1";
$s_rep_start = mysqli_prepare($database_connection, $q_rep_start);
mysqli_stmt_bind_param($s_rep_start, 'i', $item_id);
mysqli_stmt_execute($s_rep_start);
$r_rep_start = mysqli_stmt_get_result($s_rep_start);
$row_rep_start = mysqli_fetch_assoc($r_rep_start);

// Prepare and execute SQL statement to count number of reps
$stmt = $database_connection->prepare("SELECT COUNT(*), repvalue FROM reps WHERE ownerID = ? AND itemID = ?");
$stmt->bind_param("ii", $ownerID, $item_id);
$stmt->execute();
$stmt->bind_result($countreps, $my_current_rep);
$stmt->fetch();
$stmt->close();

// If entry does not exist, insert it with repvalue set to $rep_val and update item reputation
if ($countreps < 1) {
    $stmtx = $database_connection->prepare("INSERT INTO reps (ownerID, itemID, repvalue) VALUES (?, ?, ?)");
    $stmtx->bind_param("iis", $ownerID, $item_id, $rep_val);
    $stmtx->execute();
    $new_rep_value = $rep === 'up' ? $row_rep_start['reputation'] + 1 : $row_rep_start['reputation'] - 1;
} else {
    // If entry already exists, update repvalue and item reputation based on current and new repvalue
    $stmtx = $database_connection->prepare("UPDATE reps SET repvalue = ? WHERE ownerID = ? AND itemID = ?");
    $stmtx->bind_param("sii", $rep_val, $ownerID, $item_id);
    $stmtx->execute();
    $stmtx->close();
    
    
    if ($loggedin)
    {
    
        if ($my_current_rep === 'up') 
        {
            if ($rep === 'down') 
            {
                $new_rep_value = $row_rep_start['reputation'] - 2;
            } 
            else
            {
                $new_rep_value = $row_rep_start['reputation'];
            }
        }
        else
        {
            if ($rep === 'up') 
            {
                $new_rep_value = $row_rep_start['reputation'] + 2; // Changed from +1 to +2
            } 
            else 
            {
                $new_rep_value = $row_rep_start['reputation'];
            }
        }
    }
    else
    {
        $new_rep_value = $row_rep_start['reputation'];
    }
}

// Update item reputation in database and print new rep value
$stmty = $database_connection->prepare("UPDATE items SET reputation = ? WHERE id = ?");
$stmty->bind_param("ii", $new_rep_value, $item_id);
$stmty->execute();
$stmty->close();
$database_connection->close();
print($new_rep_value);


?>
