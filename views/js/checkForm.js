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

function checkBusiness() {
    var name = checkBusinessName(document.getElementById('businessName').value);
    var user = checkUsername(document.getElementById('username').value);
    var pass = checkPassword(document.getElementById('passwordA').value);
    var repass = checkConfirmPassword(document.getElementById('re-password').value);
    var adress = checkAdress(document.getElementById('adress').value);
    var phone = checkPhone(document.getElementById('phoneA').value);
    var mail = checkEmail(document.getElementById('email').value);
    if (name && user && pass && repass && adress && phone && mail) {
        return true;
    } else {
        return false;
    }
}

