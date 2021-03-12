'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

class Workout {
  id = +new Date();
  creationDate = new Date();

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lon]
    this.distance = distance;
    this.duration = duration;
  }
}

class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calculatePace();
  }

  type = 'Running';

  calculatePace() {
    this.pace = Number((this.duration / this.distance).toFixed(2));
    return this.pace;
  }
}

class Cycling extends Workout {
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calculateSpeed();
  }

  type = 'Cycling';

  calculateSpeed() {
    this.speed = Number((this.distance / this.duration).toFixed(2));
    return this.speed;
  }
}

// App Architecture
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    this._getPosition();

    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () =>
        alert('Could not get your position!')
      );
    }
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const myCoords = [latitude, longitude];
    this.#map = L.map('map').setView(myCoords, 17);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const isNumber = (...inputs) =>
      inputs.every((input) => Number.isFinite(input));

    const isPositiveNumber = (...numbers) =>
      numbers.every((number) => number > 0);

    e.preventDefault();

    // Get data from form
    const type = inputType.value; // running || cycling
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let cadence, elevation, workout;
    const {
      lat: workoutLatitude,
      lng: workoutLongitude,
    } = this.#mapEvent.latlng;

    // If activity = running, create instance of `Running`
    if (type == 'running') {
      cadence = +inputCadence.value;

      if (
        !isNumber(distance, duration, cadence) ||
        !isPositiveNumber(distance, duration, cadence)
      )
        return alert('Please enter a positive number.');

      workout = new Running(
        [workoutLatitude, workoutLongitude],
        distance,
        duration,
        cadence
      );
    }

    // If activity = cycling, create instance of `Cycling`
    if (type == 'cycling') {
      elevation = +inputElevation.value;

      if (
        !isNumber(distance, duration, elevation) ||
        !isPositiveNumber(distance, duration)
      )
        return alert('Please enter a positive number.');

      workout = new Cycling(
        [workoutLatitude, workoutLongitude],
        distance,
        duration,
        elevation
      );
    }

    // Add new instance to workouts aray
    this.#workouts.push(workout);

    // Render workout to map as a marker
    this.renderWorkoutMarker(workout);

    // Render workout to list

    // Hide form and clear input fields
    inputDistance.value = inputDuration.value = inputCadence.value = '';
    inputElevation.value &&= '';

    form.focus();
  }

  renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type.toLowerCase()}-popup`,
        })
      )
      .setPopupContent(`${workout.type}`)
      .openPopup();
  }
}

// Initialize an instance of the App and get user's position
const app = new App();
