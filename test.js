const ctlCtm = require('./controller/Customer-controller');

ctlCtm.get_Item_Customer_Username("bingii98").then((data) => {
    if(data.length === 1){
        console.log(data[0].password);
    }else{
        console.log('Something went wrong!');
    }
});