import AbstractStatefulView from '../framework/view/abstract-stateful-view.js';
import { convertToISO, DateTemplates, getTimeFromTemplate } from '../utils/time.js';
import { getDestinationByName, getOffersByType, toUppercaseFirstLetter, toKebabCase } from '../utils/utils.js';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import he from 'he';


const EVENTS_TYPES = ['taxi', 'bus', 'train', 'ship', 'drive', 'flight', 'check-in', 'sightseeing', 'restaurant'];

const datepickerSettings = {

  dateFormat: 'j/n/y H:i',
  enableTime: true,
  utc: true,

};

function createDestinationPicturesTemplate(destination) {

  return `
    <div class="event__photos-container">
      <div class="event__photos-tape">
      ${destination.pictures.map((picture) => `<img class="event__photo" src="${picture.src}" alt="${picture.description}"></img >`).join('')}
      </div>
    </div>
  `;
}

function createEditEventDestinationTemplate(destination) {
  return `
  <section class="event__section  event__section--destination">
    <h3 class="event__section-title  event__section-title--destination">Destination</h3>
    <p class="event__destination-description">${destination.description}</p>
    ${destination.pictures.length ? createDestinationPicturesTemplate(destination) : ''}
  </section>

  `;
}

function createEditEventOffersTemplate({ offers, typedOffers, isDisabled }) {
  return `
  <section class="event__section  event__section--offers">
    <h3 class="event__section-title  event__section-title--offers">Offers</h3>

    <div class="event__available-offers">
    ${typedOffers.map((offer) => {
    const isCheckedAttribute = offers.some((activeOffer) => activeOffer === offer.id) ? 'checked' : '';
    return `
      <div class="event__offer-selector">
      <input class="event__offer-checkbox  visually-hidden" id="${offer.id}" type="checkbox" name="event-offer-${toKebabCase(offer.title)}" ${isCheckedAttribute} ${isDisabled ? 'disabled' : ''}>
      <label class="event__offer-label" for="${offer.id}">
        <span class="event__offer-title">${offer.title}</span>
        +€&nbsp;
        <span class="event__offer-price">${offer.price}</span>
      </label>
    </div>`;
  }).join('')}
  </section>`;

}

function createEditEventTypeListTemplate(checkedType) {

  return `
  <div class="event__type-list">
    <fieldset class="event__type-group">
      <legend class="visually-hidden">Event type</legend>

      ${EVENTS_TYPES.map((type) => `
        <div class="event__type-item">
        <input id="event-type-${type}-1" class="event__type-input  visually-hidden" type="radio" name="event-type" value="${type}" ${type === checkedType ? 'checked' : ''}>
        <label class="event__type-label  event__type-label--${type}" for="event-type-${type}-1">${toUppercaseFirstLetter(type)}</label>
      </div>
        `).join('')}

    </fieldset>
  </div>
  `;
}

function createEditEventRollupBtnTemplate() {
  return `<button class="event__rollup-btn" type="button">
           <span class="visually-hidden">Close event</span>
          </button>`;

}

function createEditEventDestinationsListTemplate(allDestinations) {
  return `
  <datalist id="destination-list-1">
  ${allDestinations.map((destinationName) => `
    <option value="${destinationName}"></option>
    `).join('')}
  </datalist>`;
}

function createEditEventTemplate({ basePrice, type, dateTo, dateFrom, allDestinationsNames, isNew, offers, fullDestination, typedOffers, isDisabled, isSaving, isDeleting }) {
  return `<li class="trip-events__item">
              <form class="event event--edit" action="#" method="post">
                <header class="event__header">
                  <div class="event__type-wrapper">
                    <label class="event__type  event__type-btn" for="event-type-toggle-1">
                      <span class="visually-hidden">Choose event type</span>
                      <img class="event__type-icon" width="17" height="17" src="img/icons/${type}.png" alt="Event type icon">
                    </label>
                    <input class="event__type-toggle  visually-hidden" id="event-type-toggle-1" type="checkbox" ${isDisabled ? 'disabled' : ''}>
                    ${createEditEventTypeListTemplate(type)}
                  </div>

                  <div class="event__field-group  event__field-group--destination">
                    <label class="event__label  event__type-output" for="event-destination-1">
                      ${type}
                    </label>

                    <input class="event__input  event__input--destination" id="event-destination-1" type="text" name="event-destination" value="${he.encode(!fullDestination?.name ? '' : fullDestination.name)}" list="destination-list-1" required ${isDisabled ? 'disabled' : ''}>
                    ${createEditEventDestinationsListTemplate(allDestinationsNames)}
                  </div >

                  <div class="event__field-group  event__field-group--time">
                    <label class="visually-hidden" for="event-start-time-1">From</label>
                    <input class="event__input  event__input--time" id="event-start-time-1" type="text" name="event-start-time" value="${getTimeFromTemplate(DateTemplates.DATETIME_INPUT_FORMAT, dateFrom)}" ${isDisabled ? 'disabled' : ''}>
                    —
                    <label class="visually-hidden" for="event-end-time-1">To</label>
                    <input class="event__input  event__input--time" id="event-end-time-1" type="text" name="event-end-time" value="${getTimeFromTemplate(DateTemplates.DATETIME_INPUT_FORMAT, dateTo)}" ${isDisabled ? 'disabled' : ''}>
                  </div>

                  <div class="event__field-group  event__field-group--price">
                    <label class="event__label" for="event-price-1">
                      <span class="visually-hidden">${he.encode(basePrice.toString())}</span>
                      €
                    </label>
                    <input class="event__input  event__input--price" id="event-price-1" type="text" name="event-price" value="${he.encode(basePrice.toString())}" ${isDisabled ? 'disabled' : ''}>
                  </div>

                  <button class="event__save-btn btn btn--blue" type="submit" >${isSaving ? 'Saving...' : 'Save'}</button>
                  <button class="event__reset-btn" type="reset" >${getButtonText(isNew, isDeleting)}</button>
  ${!isNew ? createEditEventRollupBtnTemplate() : ''}
<span class="visually-hidden">${isNew ? 'Cancel' : 'Delete'} event</span>
                  </button >
                </header>
  <section class="event__details">
    ${typedOffers.length ? createEditEventOffersTemplate({ offers, typedOffers, isDisabled }) : ''}

    ${fullDestination?.name && fullDestination.description ? createEditEventDestinationTemplate(fullDestination) : ''}
  </section>
              </form >
            </li > `;
}

function getButtonText(isNew, isDeleting) {
  let buttonText = '';
  if (isNew) {
    buttonText = 'Cancel';
  } else if (isDeleting) {
    buttonText = 'Deleting...';
  } else {
    buttonText = 'Delete';
  }

  return buttonText;
}

export default class EditEventView extends AbstractStatefulView {
  #event = null;
  #handleSubmit = null;
  #handleCloseClick = null;
  #handleDeleteClick = null;
  #allDestinations = null;
  #allOffers = null;
  #sourcedState = null;
  #datepickerFrom = null;
  #datepickerTo = null;


  constructor({ event, fullDestination, allDestinationsNames, onSubmit, onCloseClick, onDeleteClick, allDestinations, allOffers, }) {
    super();
    this.#event = event;
    this._setState({
      ...event,
      fullDestination,
      allDestinationsNames,
      isDisabled: false,
      isSaving: false,
      isDeleting: false
    });
    this.#sourcedState = { ...event, fullDestination, allDestinationsNames };
    this.#handleSubmit = onSubmit;
    this.#allOffers = allOffers;
    this.#allDestinations = allDestinations;
    this.#handleDeleteClick = onDeleteClick;
    this.#handleCloseClick = onCloseClick;
    this._restoreHandlers();

  }

  get template() {
    return createEditEventTemplate({ ...this._state, typedOffers: getOffersByType(this.#allOffers, this._state.type) });
  }

  reset = () => {
    this.updateElement(this.#sourcedState);
  };

  _restoreHandlers() {

    this.element.querySelector('.event__save-btn').addEventListener('click', this.#submitHandler);
    this.element.querySelector('.event__rollup-btn')?.addEventListener('click', this.#clickCloseHandler);
    this.element.querySelector('.event__type-list').addEventListener('change', this.#changeTypeHandler);
    this.element.querySelector('.event__input--destination').addEventListener('change', this.#changeDestinationHandler);
    this.element.querySelector('.event__available-offers')?.addEventListener('change', this.#changeOfferHandler);
    this.element.querySelector('.event__input--price').addEventListener('input', this.#changePriceHandler);
    this.element.querySelector('.event__input--price').addEventListener('click', (evt) => {
      evt.currentTarget.value = '';
    });

    this.#setDatepickerFrom();
    this.#setDatepickerTo();
    this.element.querySelector('.event__reset-btn').addEventListener('click', this.#clickDeleteHandler);

  }

  removeElement() {
    super.removeElement();

    if (this.#datepickerFrom) {
      this.#datepickerFrom.destroy();
      this.#datepickerFrom = null;
    }
    if (this.#datepickerTo) {
      this.#datepickerTo.destroy();
      this.#datepickerTo = null;
    }
  }

  #submitHandler = (event) => {
    event.preventDefault();
    if (this._state.dateFrom && this._state.dateTo && this._state.dateFrom !== this._state.dateTo) {
      this.#event = EditEventView.parseStateToEvent(this._state);
      this.#handleSubmit(this.#event);
    }

  };

  #clickCloseHandler = (event) => {
    event.preventDefault();
    this.#handleCloseClick();
  };

  #setDatepickerFrom() {
    this.#datepickerFrom = flatpickr(this.element.querySelector('#event-start-time-1'), {
      ...datepickerSettings,
      defaultDate: this._state.dateFrom,
      maxDate: this._state.dateTo,
      onClose: this.#closeDatepickerFromHandler,
    });
  }

  #setDatepickerTo() {
    this.#datepickerTo = flatpickr(this.element.querySelector('#event-end-time-1'), {
      ...datepickerSettings,
      defaultDate: this._state.dateTo,
      minDate: this._state.dateFrom,
      onClose: this.#closeDatepickerToHandler,
    });
  }

  #closeDatepickerFromHandler = (_, dateStr) => {

    this._setState({ dateFrom: convertToISO(dateStr) });
    this.#datepickerTo.set('minDate', this._state.dateFrom);
  };

  #closeDatepickerToHandler = (_, dateStr) => {
    this._setState({ dateTo: convertToISO(dateStr) });
    this.#datepickerFrom.set('maxDate', this._state.dateTo);
  };

  #changeTypeHandler = (evt) => {
    this.updateElement({ allOffers: getOffersByType(this.#allOffers, evt.target.value), type: evt.target.value, offers: [] });

  };

  #clickDeleteHandler = (evt) => {
    evt.preventDefault();
    this.#handleDeleteClick(EditEventView.parseStateToEvent(this._state));
  };

  #changeOfferHandler = (evt) => {
    const isChecked = evt.target.checked;

    if (isChecked) {

      const updatedOffers = [...this._state.offers, evt.target.id];
      this._setState({ offers: updatedOffers });

    } else {

      const updatedOffers = this._state.offers.filter((id) => id !== evt.target.id);
      this._setState({ offers: updatedOffers });
    }
  };

  #changeDestinationHandler = (evt) => {
    const newDestination = getDestinationByName(this.#allDestinations, evt.target.value) ?? this._state.fullDestination;
    if (!newDestination) {
      evt.target.value = '';
      return;
    }

    this.updateElement({ fullDestination: newDestination, destination: newDestination.id });
  };

  #changePriceHandler = (evt) => {

    this._setState({ basePrice: evt.target.value });
  };

  static parseStateToEvent(state) {
    const newEvent = structuredClone(state);
    delete newEvent.allDestinations;
    delete newEvent.typedOffers;
    delete newEvent.fullDestination;
    delete newEvent.allDestinationsNames;
    delete newEvent.isNew;
    delete newEvent.isDisabled;
    delete newEvent.isSaving;
    delete newEvent.isDeleting;

    return newEvent;
  }

}
