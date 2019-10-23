const AWS = require('aws-sdk');

AWS.config.update({
  region: "CNM",
  endpoint: "http://localhost:8000"
});

let dynamodb = new AWS.DynamoDB();

let params = {
  TableName: "Customers",
  KeySchema: [
    { AttributeName: "customerID", KeyType: "HASH" },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'username_index',
      KeySchema: [
        { AttributeName: 'username', KeyType: 'HASH' }
      ],
      Projection: {
        ProjectionType: "KEYS_ONLY"
      },
      ProvisionedThroughput: {
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10
      }
    }
  ],
  AttributeDefinitions: [
    { AttributeName: "customerID", AttributeType: "S" },
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