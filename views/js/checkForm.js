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

function checkAdress(str) {
    var re = /^((?![\^!@#$*~ <>?]).)((?![\^!@#$*~<>?]).){0,73}((?![\^!@#$*~ <>?]).)$/;
    if (!re.test(str)) {
        $('#error_adress').text('Địa chỉ lớn hơn 3 ký tự!');
    } else {
        $('#error_adress').text('');
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



//CHECK FOR EDIT

function checkAdressEdit(str) {
    var re = /^((?![\^!@#$*~ <>?]).)((?![\^!@#$*~<>?]).){0,73}((?![\^!@#$*~ <>?]).)$/;
    if (!re.test(str)) {
        $('#error_adress_edit').text('Địa chỉ lớn hơn 3 ký tự!');
    } else {
        $('#error_adress_edit').text('');
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
    let adress = checkAdressEdit(document.getElementById('edit_bnAdress').value);
    let phone = checkPhoneEdit(document.getElementById('edit_bnPhone').value);
    let mail = checkEmailEdit(document.getElementById('edit_bnEmail').value);
    if (adress && phone && mail) {
        document.getElementById("formEdit").submit();
    }
}

function setBusinessID_Input(BusinessID,BusinessName){
    document.getElementById("businessIDEdit").value = BusinessID;
    document.getElementById("businessNameEdit").value = BusinessName;
}