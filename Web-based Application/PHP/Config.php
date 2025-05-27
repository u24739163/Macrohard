<?php
// Database configuration
    const HOST = 'wheatley.cs.up.ac.za';         // or your DB server hostname
    const DBNAME = 'u23554607_priceCheck';   // replace with your database name
    CONST DBUSERNAME = 'u23554607'; // replace with your DB username
    CONST PASSWORD='Q6YXJVSPB5FVAKWBCRVUYKMVNI64P3YH';
    $conn = new mysqli(HOST,DBUSERNAME, PASSWORD, DBNAME);
    if ($conn->connect_error) {
        die("Database connection failed: " . $conn->connect_error);
    }
?>