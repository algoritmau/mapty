'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
let map, mapEvent;

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    function (position) {
      const { latitude, longitude } = position.coords;
      const myCoords = [latitude, longitude];
      map = L.map('map').setView(myCoords, 17);

      L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      map.on('click', handleClickOnMap);
    },
    () => alert('Could not get your position!')
  );
}

function handleClickOnMap(mapE) {
  mapEvent = mapE;
  form.classList.remove('hidden');
  inputDistance.focus();
}

function handleFormSubmission(e) {
  e.preventDefault();

  inputDistance.value = '';
  inputDuration.value = '';

  const { lat: latitudeToPin, lng: longitudeToPin } = mapEvent.latlng;

  L.marker([latitudeToPin, longitudeToPin])
    .addTo(map)
    .bindPopup(
      L.popup({
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        className: 'running-popup',
      })
    )
    .setPopupContent('Workout')
    .openPopup();

  form.focus();
}

function handleInputChange() {
  inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
}

form.addEventListener('submit', handleFormSubmission);

inputType.addEventListener('change', handleInputChange);
