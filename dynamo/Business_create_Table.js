const AWS = require('aws-sdk');

AWS.config.update({
  "region": "us-east-1",
  "endpoint": "http://localhost:8000",
});

let dynamodb = new AWS.DynamoDB();

let params = {
  TableName: "Businesss",
  KeySchema: [
    { AttributeName: "businessID", KeyType: "HASH" },
    { AttributeName: "businessName", KeyType: "RANGE" },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'username_index',
      KeySchema: [
        { AttributeName: 'username', KeyType: 'HASH' }
      ],
      Projection: {
        ProjectionType: "ALL"
      },
      ProvisionedThroughput: {
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10
      }
    }
  ],
  AttributeDefinitions: [
    { AttributeName: "businessID", AttributeType: "S" },
    { AttributeName: "businessName", AttributeType: "S" },
    { AttributeName: "username", AttributeType: "S" }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 10,
    WriteCapacityUnits: 10
  }
};

dynamodb.createTable(params, (err, data) => {
  if (err) {
    console.error(`Something went wrong : \n${JSON.stringify(err, null, 2)}`);
  } else {
    console.log(`Created table - ${JSON.stringify(data.TableName, null, 2)}`);
  }
});