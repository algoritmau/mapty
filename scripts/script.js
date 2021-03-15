'use strict';
class Workout {
  id = +new Date();
  creationDate = new Date();

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lon]
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    this.description = `
      ${this.type} on ${
      months[this.creationDate.getMonth()]
    } ${this.creationDate.getDate()}
    `;
  }
}

class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calculatePace();
    this._setDescription();
  }

  type = 'Running';

  calculatePace() {
    this.pace = Number((this.duration / this.distance).toFixed(1));
    return this.pace;
  }
}

class Cycling extends Workout {
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calculateSpeed();
    this._setDescription();
  }

  type = 'Cycling';

  calculateSpeed() {
    this.speed = Number((this.distance / this.duration).toFixed(1));
    return this.speed;
  }
}

// App Architecture
const form = document.querySelector('.form');
const workoutsContainer = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapZoomLevel = 17;
  #mapEvent;
  #workouts = [];

  constructor() {
    // Get user's position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorageData();

    // Attach event handlers
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    workoutsContainer.addEventListener(
      'click',
      this._focusMapMarker.bind(this)
    );
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
    this.#map = L.map('map').setView(myCoords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    // Render map markers if data from localStorage
    this.#workouts.forEach((workout) => {
      this._renderWorkoutMarker(workout);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value = inputDuration.value = inputCadence.value = '';
    inputElevation.value &&= '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => {
      form.style.display = 'grid';
    }, 1000);
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
    this._renderWorkoutMarker(workout);

    // Render workout to list
    this._renderWorkout(workout);

    // Hide form and clear input fields
    this._hideForm();

    // Save to localStorage
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
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
      .setPopupContent(
        `${workout.type == 'Running' ? '🏃‍♂️' : '🚴🏻‍♂️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let workoutHtml = `
      <li class="workout workout--${workout.type.toLowerCase()}" data-id="${
      workout.id
    }">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type == 'Running' ? '🏃‍♂️' : '🚴🏻‍♂️'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;

    if (workout.type == 'Running') {
      workoutHtml += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
      `;
    }

    if (workout.type == 'Cycling') {
      workoutHtml += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
      `;
    }

    form.insertAdjacentHTML('afterend', workoutHtml);
  }

  _focusMapMarker(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      (log) => log.id === Number(workoutEl.dataset.id)
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorageData() {
    const localStorageData = JSON.parse(localStorage.getItem('workouts'));

    if (!localStorageData) return;

    this.#workouts = localStorageData;

    this.#workouts.forEach((workout) => {
      this._renderWorkout(workout);
    });
  }
}

// Initialize an instance of the App and get user's position
const app = new App();
