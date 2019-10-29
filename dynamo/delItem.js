var AWS = require("aws-sdk");

AWS.config.update({
    "region": "us-east-1",
    "endpoint": "http://dynamodb.us-east-1.amazonaws.com",
});
var docClient = new AWS.DynamoDB.DocumentClient();

var table = "Business";

var id = "BSN84590005";
var name = "ABC";

var params = {
    TableName:table,
    Key:{
        "businessID": id,
        "businessName" : name
    }
};

console.log("Attempting a conditional delete...");
docClient.delete(params, function(err, data) {
    if (err) {
        console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
    }
});
