var inputField = document.querySelectorAll("input"),
    inputWrapper = document.querySelectorAll(".input-wrapper"),
    iconClose = document.querySelector(".icon-close"),
    btnOpen = document.querySelector(".btn-open"),
    modal = document.querySelector(".modal");

//Events
btnOpen.addEventListener("click", openModal);
iconClose.addEventListener("click", closeModal);

// Event to Anime Input
inputField.forEach(function (el) {
    el.addEventListener("focus", animeInput);
    el.addEventListener("focusout", removeAnimeInput);
});

// To anime input
function animeInput(event) {
    event.target.closest(".input-wrapper").classList.add("active");
}

function removeAnimeInput(event) {
    if (event.target.value == "") {
        event.target.closest(".input-wrapper").classList.remove("active");
    }
}


// Open Modal

function openModal() {
    modal.classList.add("open");

}

function closeModal() {
    modal.classList.add("close");

    setTimeout(function () {
        modal.classList.remove("open");
        modal.classList.remove("close");
    }, 1500);

}

//Swiper


var mySwiper = new Swiper(".swiper-container", {
    // Optional parameters
    direction: "horizontal",
    loop: true,
    effect: "coverflow",
    centeredSlides: true,
    speed: 800,
    coverflowEffect: {
        rotate: 60,
        stretch: 10,
        depth: 150,
        modifier: 2,
        slideShadows: false
    },

    // If we need pagination
    pagination: {
        el: ".swiper-pagination",
        clickable: true
    },

    // Navigation arrows
    navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev"
    }
});
