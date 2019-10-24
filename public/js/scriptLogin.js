'use strict';

let viewPassBtns = document.querySelectorAll('.card__view-password');

viewPassBtns.forEach(function (viewPassBtn) {

  viewPassBtn.onclick = function () {
    let passInput = this.parentNode.querySelector('.card__input-group-input');
    let currType = passInput.getAttribute('type');

    if (currType === 'password') {
      passInput.setAttribute('type', 'text');
    } else {
      passInput.setAttribute('type', 'password');
    }

  };

});