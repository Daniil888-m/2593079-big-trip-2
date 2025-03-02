import { render, replace } from '../framework/render.js';
import { FilterFunctions, removeChildren } from '../utils.js';
import EditEventView from '../view/edit-event-view.js';
import EventView from '../view/event-view.js';
import EventsListView from '../view/events-list-view.js';
import EventsSortView from '../view/events-sort-view.js';
import FiltersView from '../view/filters-view.js';
import NoEventsView from '../view/no-events-view.js';


export default class EventsPresenter {
  #destinations;
  #events;
  #offers;
  #eventsContainer;
  #eventsModel;
  #noEventsView;
  #filtersContainer;
  #listComponent;

  constructor({ eventsContainer, eventsModel }) {
    this.#eventsContainer = eventsContainer;
    this.#eventsModel = eventsModel;
    this.#filtersContainer = document.querySelector('.trip-controls__filters');
  }

  init() {
    this.#events = [...this.#eventsModel.getEvents()];
    this.#destinations = [...this.#eventsModel.getDestinations()];
    this.#offers = [...this.#eventsModel.getOffers()];

    render(new FiltersView({ onClick: this.#onFilterClick }), this.#filtersContainer);

    this.#renderEvents();

  }

  #renderEvents(events = this.#events) {
    this.#clearEvents();

    if (events.length === 0) {
      render(this.#noEventsView, this.#eventsContainer);
    } else {
      render(new EventsSortView(), this.#eventsContainer);
      this.#listComponent = new EventsListView();
      render(this.#listComponent, this.#eventsContainer);
      for (let i = 1; i < events.length; i++) {
        this.#createEvent(events[i]);
      }
    }
  }

  #clearEvents = () => {
    removeChildren(this.#eventsContainer, 1);
  };

  #createEvent(event) {
    const type = event.type;
    const destination = this.#eventsModel.getDestinationById(event.destination);
    const offers = this.#eventsModel.getOffersById(event.offers, type);

    const eventComponent = new EventView({
      event, destination, offers, onClick: () => {
        replaceEventToEditForm();
        document.addEventListener('keydown', onEscKeyDown);
      }
    });
    const editEventFormComponent = new EditEventView({
      event, destination, offers,
      allDestinations: this.#eventsModel.getAllDestinationsNames(),
      onSubmit: () => {
        replaceEditFormToEvent();
        document.removeEventListener('keydown', onEscKeyDown);
      },
      onClick: () => {
        replaceEditFormToEvent();
        document.removeEventListener('keydown', onEscKeyDown);
      }
    });

    function onEscKeyDown(evt) {
      evt.preventDefault();
      replaceEditFormToEvent();
      document.removeEventListener('keydown', onEscKeyDown);
    }

    function replaceEventToEditForm() {
      replace(editEventFormComponent, eventComponent);
    }

    function replaceEditFormToEvent() {
      replace(eventComponent, editEventFormComponent);
    }

    render(eventComponent, this.#listComponent.element);
  }

  #onFilterClick = (type) => {
    const filteredEvents = FilterFunctions[type.toUpperCase()](this.#events);

    if (filteredEvents.length === 0) {
      this.#noEventsView = new NoEventsView(type);
    }

    this.#renderEvents(filteredEvents);

  };
}
