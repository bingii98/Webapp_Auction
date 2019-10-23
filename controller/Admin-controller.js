const AWS = require('aws-sdk');
const bcrypt = require('bcrypt-nodejs');

AWS.config.update({
    region: "CNM",
    endpoint: 'http://localhost:8000',
});

let docClient = new AWS.DynamoDB.DocumentClient();

async function get_Item_Admin_Username(username) {
    return new Promise((resolve, reject) => {
        let params = {
            TableName: "Admins",
            IndexName: 'username_index',
            FilterExpression: 'username = :username',
            ExpressionAttributeValues: { ":username": username }
        }
        docClient.scan(params, (err, data) => {
            if (err) {
                console.error('Error JSON:', JSON.stringify(err, null, 2));
            } else {
                resolve(data.Items);
            }
        });
    });
}

function getAll_Category(ejs, res) {
    let params = {
        TableName: 'Admins'
    }
    var CategoryList = [];
    docClient.scan(params, (err, data) => {
        if (err) {
            console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
        } else {
            data.Items.forEach(item => {
                item.category.forEach(cat => {
                    CategoryList.push(cat);
                });
            });

            res.render(ejs, { _uG: CategoryList });
        }
    });
}


module.exports = {
    get_Item_Admin_Username: get_Item_Admin_Username,
    getAll_Category : getAll_Category,
};