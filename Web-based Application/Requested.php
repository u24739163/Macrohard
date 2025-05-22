<?php

header("Content-Type: application/json");
require_once 'Config.php'; //change for the file that has the loci of your database
session_start();
$json = file_get_contents('php://input');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Only POST requests allowed"]);
    exit;
}


$data = json_decode($json, true);
if (!$data) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid JSON input"]);
    exit;
}

// ******************************************************
// Establish the connection and object (Singleton)
// ******************************************************
class API {
    private static $instance = null;
    private $conn;

    private function __construct() {
        global $conn;
        $this->conn = $conn;
    }

    public static function instance() {
        if (self::$instance === null) {
            self::$instance = new API();
        }
        return self::$instance;
    }

    public function __destruct() {
        $this->conn->close();
    }

/*
Register
*/

    public function register($name, $surname, $email, $password, $user_type) {
        $name = trim($name);
        $surname = trim($surname);
        $email = trim($email);
        $password = trim($password);

        // Validate required fields
        
        // Validate name and surname format
        if (!preg_match("/^[a-zA-Z]+$/", $name) || !preg_match("/^[a-zA-Z]+$/", $surname)) {
            return "Name and surname must contain only letters.";
        }

        // Validate email format
        if (!preg_match('/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/',$email)) {
            return "Invalid email format.";
        }

        // Validate type
        $types=['Customer','Admin'];
        if( !in_array($user_type,$types)){
            return "Invalid ";
        }

        // Check if email already exists
        $stmt = $this->conn->prepare("SELECT `UserID` FROM `User` WHERE Email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $stmt->store_result();

        if ($stmt->num_rows > 0) {
            return "Email already exists.";
        }
        $stmt->close();

        // Validate password strength
        if (!preg_match("/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W]).{8,}$/", $password)) {
            return "Password must be at least 8 characters long with uppercase, lowercase, a number, and a special character.";
        }

        $saltLength=10;
        $salt=bin2hex(random_bytes($saltLength));
        $hashedPassword=hash('sha512',$password.$salt);

        // Generate API key securely
        $apiKey = bin2hex(random_bytes(16));
        //16 *2 'because there is 2 characters per byte' =32 character long string
        $date = date("Y-m-d");
        // Insert user into database
        $stmt = $this->conn->prepare("INSERT INTO `User` (FirstName, LastName, Email, PasswordHash,Salt,DateJoined ,Apikey,`Type`,ThemeID) VALUES (?, ?, ?,?, ?, NOW(),?, ?,1)");
        $stmt->bind_param("sssssss", $name, $surname, $email, $hashedPassword,$salt,$apiKey,$user_type);
        $stmt->execute();
        $stmt->close();
        return $apiKey;
    }

    /*
    Responders
    */

    function response($success, $data = "Post parameters are missing") {
        if($success==false){
            $success="error";
        }
        $timestamp = time();
        echo json_encode(["success" => $success, "timestamp" => $timestamp , "data" => $data]);
    }

    function responseSucc($success,$data = "Post parameters are missing") {
        http_response_code(200);
        $timestamp = time();
        if($success==true){
            $success="success";
        }
        echo json_encode(["success" => $success, "timestamp" => $timestamp, "data" => $data]);
    }

    function responseKey($success,$data = "Post parameters are missing") {
        http_response_code(200);
        $timestamp = time();
        if($success==false){
            $success="success";
        }
        echo json_encode(["success" => $success, "timestamp" => $timestamp, "data" => ["key"=>$data]]);
    }

}

$api = API::instance();

if (isset($data['type']) && $data['type'] === "Register") {
    if(isset($data['name']) &&
    isset($data['surname']) &&
    isset($data['password']) &&
    isset($data['email'])){

        $key=$api->register($data['name'], $data['surname'], $data['email'], $data['password'], 'Customer');
        
        if ($key == "Email already exists.") {
            
            $api->response(false, "Invalid email format try again");
            http_response_code(401);    
        } else if ($key == "Name and surname must contain only letters.") {
            
            $api->response(false, "Invalid name/surname format.");
            http_response_code(400);
        } else if ($key == "Password must be at least 8 characters long with uppercase, lowercase, a number, and a special character.") {
            
            $api->response(false, "Invalid password format.");
            http_response_code(400);
        } else if ($key == "Invalid email format.") {
            
            $api->response(false, "Invalid email format.");
            http_response_code(400);

        }else if ($key=="Invalid"){
            http_response_code(400);
            $api->response(false, "Invalid type.");
            
        } else {
            $api->responseKey(true, $key);
        }
    }else{
        
        $api->response(false, "All fields are required.");
        http_response_code(400);
    }
}else if (isset($data['type']) && $data['type'] === "Admin") {
    if(isset($data['name']) &&
    isset($data['surname']) &&
    isset($data['password']) &&
    isset($data['email'])){

        $key=$api->register($data['name'], $data['surname'], $data['email'], $data['password'], 'Admin');
        
        if ($key == "Email already exists.") {
            
            $api->response(false, "Invalid email format try again");
            http_response_code(401);    
        } else if ($key == "Name and surname must contain only letters.") {
            
            $api->response(false, "Invalid name/surname format.");
            http_response_code(400);
        } else if ($key == "Password must be at least 8 characters long with uppercase, lowercase, a number, and a special character.") {
            
            $api->response(false, "Invalid password format.");
            http_response_code(400);
        } else if ($key == "Invalid email format.") {
            
            $api->response(false, "Invalid email format.");
            http_response_code(400);

        }else if ($key=="Invalid"){
            http_response_code(400);
            $api->response(false, "Invalid type.");
            
        } else {
            $api->responseKey(true, $key);
        }
    }else{
        
        $api->response(false, "All fields are required.");
        http_response_code(400);
    }
}
?>