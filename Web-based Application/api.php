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
        if($testing==""){
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
    
    function NormalGetProducts(){
        $result =$this->conn->query("SELECT P.`ProductID` AS `ID` ,P.`Name` AS `Name` ,B.Name AS `Brand`,C.Name AS `Category` 
        FROM Category AS C JOIN( Product AS P JOIN Brand AS B ON P.BrandID=B.BrandID)
         ON C.CategoryID=P.CategoryID ORDER BY RAND() LIMIT 300 ");

        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $additions=$this->GetAddition($row['ID']);
                $row['Price']=$additions['Price'];
                $row['Stars']=$additions['Stars'];
                $row['NumReviews']=$additions['NumReviews'];
                $row['Retailers']=$additions['Retailers'];
                $row['Image']=$additions['Image'];
                $Product[] = $row;
            }
            $returner['Products']=$Product;
            $result->free();
            $this->response("Success",$returner);
            return;
        }
        http_response_code(500);
        $this->response("false","Unknown error has occurred");
        
    }

    function Brands($Brand){
        if(!is_numeric($Brand)){
            http_response_code(400);
            $this->response("false","Incorrect category id.");
            return;
        }
        $stmt=$this->conn->prepare("SELECT P.`ProductID` AS `ID` ,P.`Name` AS `Name` ,B.Name AS `Brand`,C.Name AS `Category` 
        FROM Category AS C JOIN( Product AS P JOIN Brand AS B ON P.BrandID=B.BrandID)
         ON C.CategoryID=P.CategoryID WHERE B.BrandID=? LIMIT 300 ");
        $stmt->bind_param("i",$Brand);
        $stmt->execute();
        $result=$stmt->get_result();
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $additions=$this->GetAddition($row['ID']);
                $row['Price']=$additions['Price'];
                $row['Stars']=$additions['Stars'];
                $row['NumReviews']=$additions['NumReviews'];
                $row['Retailers']=$additions['Retailers'];
                $row['Image']=$additions['Image'];
                $Product[] = $row;
            }
            $returner['Products']=$Product;
            $result->free();
            $this->response("Success",$returner);
            return;
        }
        http_response_code(500);
        $this->response("false","Unknown error has occurred");

    }

    function Search($Search){
        $stmt=$this->conn->prepare("SELECT 
            P.`ProductID` AS `ID`,
            P.`Name` AS `Name`,
            B.`Name` AS `Brand`,
            C.`Name` AS `Category`
        FROM 
            Category AS C
            JOIN (Product AS P JOIN Brand AS B ON P.BrandID = B.BrandID)
                ON C.CategoryID = P.CategoryID
        WHERE 
            P.`Name` LIKE CONCAT('%', ?, '%')
        LIMIT 300;");
        
        $stmt->bind_param("s",$Search);
        $stmt->execute();
        $result=$stmt->get_result();
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $additions=$this->GetAddition($row['ID']);
                $row['Price']=$additions['Price'];
                $row['Stars']=$additions['Stars'];
                $row['NumReviews']=$additions['NumReviews'];
                $row['Retailers']=$additions['Retailers'];
                $row['Image']=$additions['Image'];
                $Product[] = $row;
            }
            $returner['Products']=$Product;
            $result->free();
            $this->response("Success",$returner);
            $stmt->close();
            return;
        }
        http_response_code(500);
        $this->response("false","Unknown error has occurred");
    }

    function OnlyCat($Cat){
        $categoryIds = $this->GetCatID($Cat);
        if (!is_array($categoryIds)) {
            $categoryIds = [$categoryIds];
        }
        $returner = [];
        $products = [];
        foreach ($categoryIds as $catId) {
            $stmt = $this->conn->prepare("SELECT 
                P.`ProductID` AS `ID`,
                P.`Name` AS `Name`,
                B.Name AS `Brand`,
                C.Name AS `Category`
            FROM 
                Category AS C 
                JOIN (Product AS P JOIN Brand AS B ON P.BrandID = B.BrandID)
                ON C.CategoryID = P.CategoryID
            WHERE 
                C.CategoryID = ?
            LIMIT 300");
            if (!$stmt) {
                http_response_code(500);
                $this->response("false", "Prepare failed: " . $this->conn->error);
                return;
            }
            $stmt->bind_param("i", $catId);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $additions = $this->GetAddition($row['ID']);
                    $row['Price'] = $additions['Price'];
                    $row['Stars'] = $additions['Stars'];
                    $row['NumReviews']=$additions['NumReviews'];
                    $row['Retailers']=$additions['Retailers'];
                    $row['Image'] = $additions['Image'];
                    $products[] = $row;
                }
                $result->free();
            }
            $stmt->close();
        }
        $returner['Products'] = $products;
        $this->response("Success", $returner);
        return;
    }

    function BrandSearch($brandId, $search){
        if (!is_numeric($brandId)) {
            http_response_code(400);
            $this->response("false", "Incorrect brand id.");
            return;
        }

        $stmt = $this->conn->prepare("SELECT 
            P.`ProductID` AS `ID`,
            P.`Name` AS `Name`,
            B.`Name` AS `Brand`,
            C.`Name` AS `Category`
        FROM 
            Category AS C
            JOIN (Product AS P JOIN Brand AS B ON P.BrandID = B.BrandID)
                ON C.CategoryID = P.CategoryID
        WHERE 
            B.BrandID = ? AND P.`Name` LIKE CONCAT('%', ?, '%')
        LIMIT 300");

        $stmt->bind_param("is", $brandId, $search);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $additions = $this->GetAddition($row['ID']);
                $row['Price'] = $additions['Price'];
                $row['Stars'] = $additions['Stars'];
                $row['NumReviews']=$additions['NumReviews'];
                $row['Retailers']=$additions['Retailers'];
                $row['Image'] = $additions['Image'];
                $Product[] = $row;
            }
            $returner['Products'] = $Product;
            $result->free();
            $this->response("Success", $returner);
            $stmt->close();
            return;
        }

        http_response_code(500);
        $this->response("false", "Unknown error has occurred");
    }

    function CategorySearch($Cat, $search){
        if (!is_numeric($Cat)) {
            http_response_code(400);
            $this->response("false", "Incorrect category id.");
            return;
        }
        $categoryIds = $this->GetCatID($Cat);
        if (!is_array($categoryIds)) {
            $categoryIds = [$categoryIds];
        }
        $returner = [];
        $products = [];
        foreach ($categoryIds as $catId) {

        $stmt = $this->conn->prepare("SELECT 
            P.`ProductID` AS `ID`,
            P.`Name` AS `Name`,
            B.`Name` AS `Brand`,
            C.`Name` AS `Category`
        FROM 
            Category AS C
            JOIN (Product AS P JOIN Brand AS B ON P.BrandID = B.BrandID)
                ON C.CategoryID = P.CategoryID
        WHERE 
            C.CategoryID = ? AND P.`Name` LIKE CONCAT('%', ?, '%')
        LIMIT 300");

        $stmt->bind_param("is", $catId, $search);
        $stmt->execute();
            $result = $stmt->get_result();
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $additions = $this->GetAddition($row['ID']);
                    $row['Price'] = $additions['Price'];
                    $row['Stars'] = $additions['Stars'];
                    $row['NumReviews']=$additions['NumReviews'];
                    $row['Retailers']=$additions['Retailers'];
                    $row['Image'] = $additions['Image'];
                    $products[] = $row;
                }
                $result->free();
            }
            $stmt->close();
        }
        $returner['Products'] = $products;
        $this->response("Success", $returner);
        return;
    }

    function CategoryBrand($Cat, $Brand){
        if (!is_numeric($Cat)) {
            http_response_code(400);
            $this->response("false", "Incorrect category id.");
            return;
        }
        $categoryIds = $this->GetCatID($Cat);
        if (!is_array($categoryIds)) {
            $categoryIds = [$categoryIds];
        }
        $returner = [];
        $products = [];
        foreach ($categoryIds as $catId) {

        $stmt = $this->conn->prepare("SELECT 
            P.`ProductID` AS `ID`,
            P.`Name` AS `Name`,
            B.`Name` AS `Brand`,
            C.`Name` AS `Category`
        FROM 
            Category AS C
            JOIN (Product AS P JOIN Brand AS B ON P.BrandID = B.BrandID)
                ON C.CategoryID = P.CategoryID
        WHERE 
            C.CategoryID = ? AND P.BrandID=?
        LIMIT 300");

        $stmt->bind_param("is", $catId, $Brand);
        $stmt->execute();
            $result = $stmt->get_result();
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $additions = $this->GetAddition($row['ID']);
                    $row['Price'] = $additions['Price'];
                    $row['Stars'] = $additions['Stars'];
                    $row['NumReviews']=$additions['NumReviews'];
                    $row['Retailers']=$additions['Retailers'];
                    $row['Image'] = $additions['Image'];
                    $products[] = $row;
                }
                $result->free();
            }
            $stmt->close();
        }
        $returner['Products'] = $products;
        $this->response("Success", $returner);
        return;
    }

    function CategoryBrandSearch($Cat,$Brand,$Search){
        if (!is_numeric($Cat) || !is_numeric($Brand)) {
            http_response_code(400);
            $this->response("false", "Invalid category or brand ID.");
            return;
        }
        $categoryIds = $this->GetCatID($Cat);
        if (!is_array($categoryIds)) {
            $categoryIds = [$categoryIds];
        }
        $returner = [];
        $products = [];
        foreach ($categoryIds as $catId) {
            $stmt = $this->conn->prepare("SELECT 
                P.`ProductID` AS `ID`,
                P.`Name` AS `Name`,
                B.Name AS `Brand`,
                C.Name AS `Category`
            FROM 
                Category AS C 
                JOIN (Product AS P JOIN Brand AS B ON P.BrandID = B.BrandID)
                ON C.CategoryID = P.CategoryID
            WHERE 
                C.CategoryID = ? AND B.BrandID = ? AND P.`Name` LIKE CONCAT('%', ?, '%')
            LIMIT 300");

        $stmt->bind_param("iis",$catId,$Brand, $Search);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $additions = $this->GetAddition($row['ID']);
                    $row['Price'] = $additions['Price'];
                    $row['Stars'] = $additions['Stars'];
                    $row['NumReviews']=$additions['NumReviews'];
                    $row['Retailers']=$additions['Retailers'];
                    $row['Image'] = $additions['Image'];
                    $products[] = $row;
                }
                $result->free();
            }
            $stmt->close();
        }
        $returner['Products'] = $products;
        $this->response("Success", $returner);
        return;

    }



    function GetCatID($Cat){
        $stmt=$this->conn->prepare("SELECT `CategoryID`,`ParentCategoryID` FROM `Category` WHERE `ParentCategoryID`=?");
        $stmt->bind_param("i", $Cat);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows === 0){
            $stmt->close();
            return $Cat;
        } else {
            $categoryIds = [];
            while ($row = $result->fetch_assoc()) {
                $categoryIds[] = $row['CategoryID'];
            }
            $result->free();
            $stmt->close();
            return $categoryIds;
        }

    }

    function GetAddition($id){
        $stmt=$this->conn->prepare("SELECT MIN(`Price`) AS Price FROM Sells where `Product_ID`=?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $Priceresult = $stmt->get_result(); 
        $Price= $Priceresult->fetch_assoc();
        $Priceresult->free();
        $stmt=$this->conn->prepare("SELECT `ImageURL`,`Caption` FROM `Image` WHERE `ProductID`=? LIMIT 1");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $ImageResult = $stmt->get_result(); 
        $Image= $ImageResult->fetch_assoc();
        $ImageResult->free();
        $stmt=$this->conn->prepare("SELECT ROUND(AVG(`Rating`), 1) AS Stars, COUNT(`Rating`) AS `Number`
                FROM Review WHERE `Product_ID` =?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $RatingResult = $stmt->get_result(); 
        $Rating= $RatingResult->fetch_assoc();
        $RatingResult->free();
        $stmt = $this->conn->prepare("SELECT `Name` FROM `Retailer` JOIN `Sells` ON `RetailerID` = `Retailer_ID` WHERE `Product_ID` = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $Retailersresult = $stmt->get_result();

        $retailers = [];
        if ($Retailersresult) {
            while ($Retailersrow = $Retailersresult->fetch_assoc()) {
                $retailers[] = $Retailersrow['Name'];
            }
        }

        $stmt->close();
        $returner['Retailers']=$retailers;
        $returner['Price']=$Price['Price'];
        $returner['Stars']=$Rating['Stars'];
        $returner['NumReviews']=$Rating['Number'];
        $returner['Image']=$Image;
        return $returner;
    }
    

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

        $stmt = $this->conn->prepare("SELECT `UserID`,`Salt`,`PasswordHash`,`Apikey`,`Type`,`ThemeID` FROM `User` WHERE Email = ?");
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
        $returner = $result->fetch_assoc(); // Only one product expected
        $stmt->close();

        if (!$returner) {
            http_response_code(404);
            $this->response("false", "Product not found");
            return;
        }
        $stmt = $this->conn->prepare("SELECT `ImageURL`, `Caption` FROM `Image` WHERE `ProductID`=?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $imgResult = $stmt->get_result();
        $images = [];
        while ($imgRow = $imgResult->fetch_assoc()) {
            $images[] = $imgRow;
        }

        $stmt=$this->conn->prepare("SELECT R.RetailerID AS RID,R.Name AS Retailer ,R.Website AS link, R.LogoURL AS logo, `Price`
             FROM `Sells` AS S JOIN Retailer AS R ON `RetailerID`=`Retailer_ID` WHERE `Product_ID`=?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $retailerResult = $stmt->get_result();
        $retailers = [];
        while ($retailerRow = $retailerResult->fetch_assoc()) {
            $RetailerID=$retailerRow['RID'];
            $stmt=$this->conn->prepare("SELECT ROUND(AVG(`Rating`), 1) AS Stars
                FROM Review
                WHERE `Retailer_ID` = ? AND `Product_ID` = ?");
            $stmt->bind_param("ii",$RetailerID,$id);
            $stmt->execute();
            $avgResult=$stmt->get_result();
            $rating=$avgResult->fetch_assoc();
            $retailerRow['Rating']=$rating['Stars'];
            $retailers[] = $retailerRow;
        }

        // Add images to the result
        $stmt=$this->conn->prepare("SELECT `Rating` AS STARS,User.`FirstName`, `Review_Date`,
         `Comment` FROM `Review` JOIN `User` ON `User_ID`=`UserID` WHERE `Product_ID`=?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $ReviewsResult = $stmt->get_result();
        $Reviews = [];
        while($reviewRow=$ReviewsResult->fetch_assoc()){
            $Reviews[]=$reviewRow;
        }

        $returner['Images'] = $images;
        $returner['Retailers']=$retailers;
        $returner['Reviewers']=$Reviews;
        
        $this->response("true", $returner);
        $stmt->close();

    }

    /*
    Converts the Apikey to an ID
    */
    function keyToId($apikey){
        $stmt = $this->conn->prepare("SELECT `UserID` FROM `User` WHERE  `Apikey`= ?");
        $stmt->bind_param("s", $apikey);
        $stmt->execute();
        $result=$stmt->get_result();
        $row=$result->fetch_assoc();
        if(!$row){
            $stmt->close();
            return;
        }else{
            $id=$row['UserID'];
        }
        $stmt->close();
        return $id;
    }


    /*
    Wishlist Handling
    */
    function wishlist($apikey){
        if(!$this->IsAPiValid($apikey)){
            http_response_code(409);
            $this->response("false","Nice Apikey");
            return;
        }
        $id=$this->keyToId($apikey);
        $stmt=$this->conn->prepare("SELECT `ProductID` FROM `Wishlist` WHERE `UserID`=?");
        $stmt->bind_param("i",$id);
        $stmt->execute();
        $result = $stmt->get_result();
        $products=[];
        while ($row = $result->fetch_assoc()){
            $products[]=$row['ProductID'];
        }
        
        $stmt->close();
        $returner = [];
        $Products=[];
        foreach ($products as $productId) {
            $Products[]=$this->returnTHEARRAY($productId);
        }
        $returner['Products']=$Products;
        
        $this->response("true", $returner);
        $stmt->close();
    }

    function returnTHEARRAY($id){
        $returner=[];
        $stmt=$this->conn->prepare("SELECT P.`ProductID`,P.`Name` FROM Product AS P WHERE `P`.`ProductID`=?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result(); 
        $returner = $result->fetch_assoc();
        $stmt->close();
        $stmt=$this->conn->prepare("SELECT MIN(`Price`) AS Price FROM Sells where `Product_ID`=?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $Priceresult = $stmt->get_result(); 
        $Price= $Priceresult->fetch_assoc();
        $stmt=$this->conn->prepare("SELECT `ImageURL`,`Caption` FROM `Image` WHERE `ProductID`=? LIMIT 1");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $ImageResult = $stmt->get_result(); 
        $Image= $ImageResult->fetch_assoc();
        $stmt=$this->conn->prepare("SELECT ROUND(AVG(`Rating`), 1) AS Stars, COUNT(`Rating`) AS `Number`
                FROM Review WHERE `Product_ID` =?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $RatingResult = $stmt->get_result(); 
        $Rating= $RatingResult->fetch_assoc();
        $RatingResult->free();
        $stmt = $this->conn->prepare("SELECT `Name` FROM `Retailer` JOIN `Sells` ON `RetailerID` = `Retailer_ID` WHERE `Product_ID` = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $Retailersresult = $stmt->get_result();

        $retailers = [];
        if ($Retailersresult) {
            while ($Retailersrow = $Retailersresult->fetch_assoc()) {
                $retailers[] = $Retailersrow['Name'];
            }
        }
        
        $returner['Retailers']=$retailers;
        $returner['Price']=$Price['Price'];
        $returner['Stars']=$Rating['Stars'];
        $returner['NumReviews']=$Rating['Number'];
        $returner['Image']=$Image;
        return $returner;
    }

    function wishlistA($addition,$apikey,$product){
        if (!$this->IsAPiValid($apikey)) {
            http_response_code(400);
            $this->response("false", "Nice Apikey");
            return;
        }
        $id=$this->keyToId($apikey);
        if($id==false){

            return $this->response(false,"Invalid Apikey");
        }
        if (empty($addition) || !preg_match('/^add|remove$/', $addition)) {
            return $this->response(false,"Invalid addition parameter");
        }

        if (!preg_match('/^\d+$/', $product)) {
            return $this->response(false, "Invalid product parameter");
        }

        if($addition==add){
            $stmt = $this->conn->prepare("INSERT INTO  `Wishlist`(`UserID`, `ProductID`, `DateAdded`) VALUES ( ?, ?, NOW())");
            $stmt->bind_param("ii",$id,$product);
            $stmt->execute();
            $stmt->close();
            return $this->response(true,"Added successfully");
        }
        $stmt = $this->conn->prepare("DELETE FROM `Wishlist` WHERE `UserID`=? AND `ProductID`=?");
        /*echo $id;
        echo"|";
        echo $product;*/
        $stmt->bind_param("ii",$id,$product);
        $stmt->execute();
        $stmt->close();
        return $this->response(true,"Removed successfully");
    }

    /*
    Get Categories
    */
    Function GetCat(){
        $categories = [];

        $result = $this->conn->query("SELECT * FROM `Category`");

        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $categories[] = $row;
            }
            $result->free();
            $this->response("Success",$categories);
        }else{
            http_response_code(400);
            $this->response("false","Failed");
        }

    }

    /*
    Get Brands
    */
    Function GetBrand(){
        $categories = [];

        $result = $this->conn->query("SELECT * FROM `Brand`");

        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $categories[] = $row;
            }
            $result->free();
            $this->response("Success",$categories);
        }else{
            http_response_code(400);
            $this->response("false","Failed");
        }

    }

    /*
    Add Review
    */

    Function AddReview($apikey,$retailerId,$Product,$Rating,$Comment){
        if (!$this->IsAPiValid($apikey)) {
            http_response_code(400);
            $this->response("false", "Nice Apikey");
            return;
        }
        
        $userId=$this->keyToId($apikey);
        if($userId==null){
            return;
        }
        if ($retailerId === null || $retailerId === "") {
            $stmt = $this->conn->prepare("INSERT INTO `Review` (`Rating`, `Retailer_ID`, `Product_ID`, `User_ID`, `Review_Date`, `Comment`) VALUES ( ?, NULL, ?, ?, NOW(), ?)");
            if (!$stmt) {
            http_response_code(500);
            $this->response("false", "Prepare failed (with retailer): " . $this->conn->error);
            return;
        }
            $stmt->bind_param("diis", $Rating, $Product, $userId, $Comment);
        } else {
            $stmt = $this->conn->prepare("INSERT INTO `Review` (`Rating`, `Retailer_ID`, `Product_ID`, `User_ID`, `Review_Date`, `Comment`) VALUES ( ?, ?, ?, ?, NOW(), ?)");
            if (!$stmt) {
            http_response_code(500);
            $this->response("false", "Prepare failed (with retailer): " . $this->conn->error);
            return;
        }
            $stmt->bind_param("diiis", $Rating, $retailerId, $Product, $userId, $Comment);
        }

        if ($stmt->execute()) {
            $insertedId = $stmt->insert_id;
            $stmt->close();
            $this->responseSucc("Success", "Inserted with ID: ".$insertedId);
        } else {
            $stmt->close();
            if ($retailerId === null || $retailerId === "") {
                $stmt = $this->conn->prepare("UPDATE `Review` SET `Rating`=?,`Review_Date`=NOW(), `Comment`=?
                 WHERE `Product_ID`=? AND `User_ID`=? ");
                if (!$stmt) {
                    http_response_code(500);
                    $this->response("false", "Prepare failed (with retailer): " . $this->conn->error);
                    return;
                }
                $stmt->bind_param("dsii", $Rating,$Comment, $Product, $userId );
                $stmt->execute();
                $insertedId = $stmt->insert_id;
                $this->responseSucc("Success", "Update ID: ".$insertedId);
                $stmt->close();
                return;
            } else {
                $stmt = $this->conn->prepare("UPDATE `Review` SET `Rating`=?,`Review_Date`=NOW(), `Comment`=?
                 WHERE `Retailer_ID`=? AND `Product_ID`=? AND `User_ID`=? ");
                if (!$stmt) {
                    http_response_code(500);
                    $this->response("false", "Prepare failed (with retailer): " . $this->conn->error);
                    return;
                }
                $stmt->bind_param("dsiii", $Rating, $Comment, $retailerId, $Product, $userId);
                $stmt->execute();
                $insertedId = $stmt->insert_id;
                $this->responseSucc("Success", "Update ID: ".$insertedId);
                $stmt->close();
                return;
            }
        }

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
            http_response_code(409);    
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
            http_response_code(200);
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
            http_response_code(409);    
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
}else if(isset($data['type']) && $data['type']==="Wishlist" && isset($data['ADDITION']) && isset($data['apikey']) && isset($data['Product'])){
    $api->wishlistA($data['ADDITION'],$data['apikey'],$data['Product']);
}else if(isset($data['type']) && $data['type']==="Wishlist" && isset($data['apikey'])){
    $api->wishlist($data['apikey']);
}else if(isset($data['type']) && $data['type']==="Cat"){
    $api->GetCat();
}else if(isset($data['type']) && $data['type']==="Brands"){
    $api->GetBrand();
}else if(isset($data['type']) && $data['type'] === "AddReview" &&
    isset($data['retailer']) &&
    isset($data['Product']) &&
    isset($data['Rating']) &&
    isset($data['Comment'])
){
    $api->AddReview($data['apikey'],$data['retailer'],$data['Product'],$data['Rating'],$data['Comment']);
}else if(isset($data['type']) && $data['type']==="Wishlist" && !isset($data['apikey'])){
    http_response_code(400);
    $api->response("False","Register first");

}else if(isset($data['type']) && $data['type']==="GetProducts" && isset($data['Brands']) && isset($data['Category']) && isset($data['Search'])){
    $api->CategoryBrandSearch($data['Category'],$data['Brands'],$data['Search']);
}else if(isset($data['type']) && $data['type']==="GetProducts" && isset($data['Brands']) && isset($data['Category'])){
    $api->CategoryBrand($data['Category'],$data['Brands']);
}else if(isset($data['type']) && $data['type']==="GetProducts" && isset($data['Search']) && isset($data['Category'])){
    $api->CategorySearch($data['Category'],$data['Search']);
}else if(isset($data['type']) && $data['type']==="GetProducts" && isset($data['Search']) && isset($data['Brands'])){
    $api->BrandSearch($data['Brands'],$data['Search']);
}else if(isset($data['type']) && $data['type']==="GetProducts" && isset($data['Category'])){
    $api->OnlyCat($data['Category']);
}else if(isset($data['type']) && $data['type']==="GetProducts" && isset($data['Search'])){
    $api->Search($data['Search']);
}else if(isset($data['type']) && $data['type']==="GetProducts" && isset($data['Brands'])){
    $api->Brands($data['Brands']);
}else if(isset($data['type']) && $data['type']==="GetProducts"){
    $api->NormalGetProducts();
}
?>