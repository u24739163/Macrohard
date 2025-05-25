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

    /*
    Verifying Apikey
    */
    public function IsAPiValid($testing){
        if (!preg_match('/^[a-z0-9]{10,32}$/', $testing)) {
            return false;
        }

        $stmt = $this->conn->prepare("SELECT `UserID` FROM `User` WHERE Apikey = ?");
        $stmt->bind_param("s",$testing);
        $stmt->execute();
        $stmt->store_result();

        if ($stmt->num_rows== 1) {
            $stmt->close();
            return true;
        }
        $stmt->close();
        return false;
    }

    /*
    GetProducts
    */

    //SELECT P.`ProductID`,P.`Name`,P.`Description`,P.`Specifications`,B.Name,C.Name FROM Category AS C JOIN( Product AS P JOIN Brand AS B ON P.BrandID=B.BrandID) ON C.CategoryID=P.CategoryID
    //SELECT MIN(`Price`) AS LowestPrice FROM Sells where `Product_ID`=6;
    //


    /*
    login
    */

    function login($email,$password){

        $email = trim($email);
        $password = trim($password);
        if (!preg_match('/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/',$email)) {
            http_response_code(400);
            $this->response("False","Invalid email format.");
            return;
        }

        if (!preg_match("/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W]).{8,}$/", $password)) {
            http_response_code(400);
            $this->response("False","Incorrect password format");
            return;
        }

        $stmt = $this->conn->prepare("SELECT `UserID`,`Salt`,`PasswordHash`,`Apikey`,`Type` FROM `User` WHERE Email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result=$stmt->get_result();
        $salt=null;
        $ComparisonPassword=null;
        $APIKEY=null;
        $type=NULL;
        $row=$result->fetch_assoc();
        if(!$row){
            http_response_code(400);
            $this->response("False","Invalid email format");
            return;
        }else{
            $APIKEY=$row['Apikey'];
            $ComparisonPassword=$row['PasswordHash'];
            $salt=$row['Salt'];
            $type=$row['Type'];
        }
        $hashedPassword=hash('sha512',$password.$salt);
        //echo $hashedPassword;
        //echo "|";
        //echo $ComparisonPassword;
        $stmt->close();
        if($ComparisonPassword==$hashedPassword){
            if($APIKEY===null){
                $this->response("False","Invalid email format");
                return;
            }
            $timestamp = time();
            $data=["Apikey"=>$APIKEY,"Type"=>$type];
            echo json_encode(["success" => "Success", "timestamp" => $timestamp, "data" =>$data]);
            return;
        }else{
            http_response_code(400);
            $this->response("False","Incorrect password");
            return;
        }
        echo "Failed";
        http_response_code(400);

    }

    /*
    view
    */

    function view($id){
        if(!is_numeric($id)){
            http_response_code(400);
            $this->response("false","The id must be a numer");
        }
        $stmt = $this->conn->prepare("SELECT P.`ProductID`,P.`Name`,P.`Description`,
        P.`Specifications`,B.Name AS Brand,C.Name AS Category
         FROM Category AS C JOIN( Product AS P JOIN Brand AS B ON 
         P.BrandID=B.BrandID) ON C.CategoryID=P.CategoryID
           WHERE `P`.`ProductID`=?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result(); 
        $returner = [];
       
        $stmt = $this->conn->prepare("SELECT `ImageURL`, `Caption` FROM `Image` WHERE `ProductID`=?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $imgResult = $stmt->get_result();
        $images = [];
        $i=1;
        while ($imgRow = $imgResult->fetch_assoc()) {
            $images[] = $imgRow;
        }

        $stmt=$this->conn->prepare("SELECT R.Name AS Retailer ,R.Website AS link, R.LogoURL AS logo, `Price`
             FROM `Sells` AS S JOIN Retailer AS R ON `RetailerID`=`Retailer_ID` WHERE `Product_ID`=?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $retailerResult = $stmt->get_result();
        $retailers = [];
        $i=1;
        while ($retailerRow = $retailerResult->fetch_assoc()) {
            $retailers[] = $retailerRow;
        }

        // Add images to the result
        
        $returner['Images'] = $images;
        $returner['Retailers']=$retailers;
        
        $this->response("true", $returner);
        $stmt->close();

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
}else if(isset($data['type']) && $data['type']==="Login"){
    $api->login($data['email'], $data['password']);
    return;
}else if(isset($data['type']) && $data['type']==="View"){
    $api->view($data['ID']);
}
?>