const AWS = require('aws-sdk');

AWS.config.update({
  "region": "us-east-1",
  "endpoint": "http://dynamodb.us-east-1.amazonaws.com",
});


let dynamodb = new AWS.DynamoDB();


//CREATE BUSINESS TABLE
let params1 = {
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

dynamodb.createTable(params1, (err, data) => {
  if (err) {
    console.error(`Something went wrong : \n${JSON.stringify(err, null, 2)}`);
  } else {
    console.log(`Created BUSINESS table -`);
  }
});
//CREATE CUSTOMER TABLE
let params2 = {
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

dynamodb.createTable(params2, (err, data) => {
  if (err) {
    console.error(`Something went wrong : \n${JSON.stringify(err, null, 2)}`);
  } else {
    console.log(`Created CUSTOMER table -`);
  }
});

//CREATE Admin TABLE
let params3 = {
  TableName: "Admins",
  KeySchema: [
    { AttributeName: "adminID", KeyType: "HASH" },
    { AttributeName: "adminName", KeyType: "RANGE" },
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
    { AttributeName: "adminID", AttributeType: "S" },
    { AttributeName: "adminName", AttributeType: "S" },
    { AttributeName: "username", AttributeType: "S" }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 10,
    WriteCapacityUnits: 10
  }
};

dynamodb.createTable(params3, (err, data) => {
  if (err) {
    console.error(`Something went wrong : \n${JSON.stringify(err, null, 2)}`);
  } else {
    console.log(`Created ADMIN table -`);
  }
});
