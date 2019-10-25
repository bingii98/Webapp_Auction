function checkEmail(str) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!re.test(str)) {
        $('#error_email').text('Email sai định dạng!');
    } else {
        $('#error_email').text('');
    }
    return re.test(str);
}

function checkBusinessName(str) {
    var re = /^((?![\^!@#$*~ <>?]).)((?![\^!@#$*~<>?]).){0,73}((?![\^!@#$*~ <>?]).)$/;
    if (!re.test(str)) {
        $('#error_businessName').text('Tên lớn hơn 1 ký tự!');
    } else {
        $('#error_businessName').text('');
    }
    return re.test(str);
}

function checkUsername(str) {
    var re = /^[a-z0-9]{8,16}$/;
    if (!re.test(str)) {
        $('#error_username').text('Username gồm 8-16 ký tự không có đặc biệt!');
    } else {
        $('#error_username').text('');
    }
    return re.test(str);
}

function checkPassword(str) {
    var re = /^[a-z0-9]{3,16}$/;
    if (!re.test(str)) {
        $('#error_password').text('Password gồm 3-16 ký tự không có đặc biệt,!');
    } else {
        $('#error_password').text('');
    }
    return re.test(str);
}

function checkConfirmPassword(str) {
    if (str === document.getElementById('passwordA').value) {
        $('#error_repassword').text('');
    } else {
        $('#error_repassword').text('Nhập lại mật khẩu không khớp!');
    }
    return str === document.getElementById('passwordA').value;
}

function checkAddress(str) {
    var re = /^((?![\^!@#$*~ <>?]).)((?![\^!@#$*~<>?]).){0,73}((?![\^!@#$*~ <>?]).)$/;
    if (!re.test(str)) {
        $('#error_address').text('Địa chỉ lớn hơn 3 ký tự!');
    } else {
        $('#error_address').text('');
    }
    return re.test(str);
}

function checkPhone(str) {
    var re = /^\+?\d{1,3}?[- .]?\(?(?:\d{2,3})\)?[- .]?\d\d\d[- .]?\d\d\d\d$/;
    if (!re.test(str)) {
        $('#error_phone').text('Số điện thoại không đúng!');
    } else {
        $('#error_phone').text('');
    }
    return re.test(str);
}

function checkproductName(str) {
    var re = /^((?![\^!@#$*~ <>?]).)((?![\^!@#$*~<>?]).){0,73}((?![\^!@#$*~ <>?]).)$/;
    if (!re.test(str)) {
        $('#error_productName').text('Tên lớn hơn 1 ký tự!');
    } else {
        $('#error_productName').text('');
    }
    return re.test(str);
}

function checkproductDescribe(str) {
    var re = /^((?![\^!@#$*~ <>?]).)((?![\^!@#$*~<>?]).){0,}((?![\^!@#$*~ <>?]).)$/;
    if (!re.test(str)) {
        $('#error_productDescribe').text('Mô tả phải lớn hơn 1 ký tự!');
    } else {
        $('#error_productDescribe').text('');
    }
    return re.test(str);
}

//CHECK FOR EDIT

function checkAddressEdit(str) {
    var re = /^((?![\^!@#$*~ <>?]).)((?![\^!@#$*~<>?]).){0,73}((?![\^!@#$*~ <>?]).)$/;
    if (!re.test(str)) {
        $('#error_address_edit').text('Địa chỉ lớn hơn 3 ký tự!');
    } else {
        $('#error_address_edit').text('');
    }
    return re.test(str);
}

function checkPhoneEdit(str) {
    var re = /^\+?\d{1,3}?[- .]?\(?(?:\d{2,3})\)?[- .]?\d\d\d[- .]?\d\d\d\d$/;
    if (!re.test(str)) {
        $('#error_phone_edit').text('Số điện thoại không đúng!');
    } else {
        $('#error_phone_edit').text('');
    }
    return re.test(str);
}

function checkEmailEdit(str) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!re.test(str)) {
        $('#error_email_edit').text('Email sai định dạng!');
    } else {
        $('#error_email_edit').text('');
    }
    return re.test(str);
}


function checkEditBusiness() {
    let address = checkAddressEdit(document.getElementById('edit_bnAddress').value);
    let phone = checkPhoneEdit(document.getElementById('edit_bnPhone').value);
    let mail = checkEmailEdit(document.getElementById('edit_bnEmail').value);
    if (address && phone && mail) {
        document.getElementById("formEdit").submit();
    }
}

function checkEditCustomer() {
    let name = checkBusinessName(document.getElementById('edit_customerName').value);
    let address = checkAddressEdit(document.getElementById('edit_ddress').value);
    let phone = checkPhoneEdit(document.getElementById('edit_Phone').value);
    let mail = checkEmailEdit(document.getElementById('edit_Email').value);
    if (name && address && phone && mail) {
        document.getElementById("formEdit").submit();
    }
}

//Writeform for EDIT BUSINESS
function setBusinessID_Input(BusinessID,BusinessName,address,phone,email){
    document.getElementById("businessIDEdit").value = BusinessID;
    document.getElementById("businessNameEdit").value = BusinessName;
    document.getElementById("edit_bnAddress").value = address;
    document.getElementById("edit_bnPhone").value = phone;
    document.getElementById("edit_bnEmail").value = email;
}

//Writeform for EDIT CATEGORY
function setCategoryName_Input(edit_categoryName){
    document.getElementById("edit_categoryName").value = edit_categoryName;
}

//Writeform for EDIT CUSTOMER
function setCustomer_Input(id,name,address,phone,email){
    document.getElementById("customerIDEdit").value = id;
    document.getElementById("edit_customerName").value = name;
    document.getElementById("edit_ddress").value = address;
    document.getElementById("edit_Phone").value = phone;
    document.getElementById("edit_Email").value = email;
}

//Check form for Customerr - sign up
function checkCustomerName(str) {
    var re = /^((?![\^!@#$*~ <>?]).)((?![\^!@#$*~<>?]).){0,73}((?![\^!@#$*~ <>?]).)$/;
    if (!re.test(str)) {
        $('#error_customerName').text('Tên lớn hơn 1 ký tự!');
    } else {
        $('#error_customerName').text('');
    }
    return re.test(str);
}

function checkCategoryName(str) {
    var re = /^((?![\^!@#$*~ <>?]).)((?![\^!@#$*~<>?]).){0,73}((?![\^!@#$*~ <>?]).)$/;
    if (!re.test(str)) {
        $('#error_CategoryName').text('Tên lớn hơn 1 ký tự!');
    } else {
        $('#error_CategoryName').text('');
    }
    return re.test(str);
}
