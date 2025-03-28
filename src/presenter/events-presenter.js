import { remove, render, RenderPosition } from '../framework/render.js';
import EventsListView from '../view/events-list-view.js';
import EventPresenter from './event-presenter.js';
import EventsSortView from '../view/events-sort-view.js';
import { FilterFunctions, SortFunctions } from '../utils/time.js';
import { sortNameAdapter } from '../utils/utils.js';
import { FilterTypes, SortTypes, UpdateTypes, UserActions } from '../consts.js';
import NoEventsView from '../view/no-events-view.js';
import NewEventBtnView from '../view/new-event-btn-view.js';
import NewEventPresenter from './new-event-presenter.js';


export default class EventsPresenter {
  #destinations = null;
  #eventsContainer = null;
  #eventsModel = null;
  #filterModel = null;
  #listComponent = null;
  #sortComponent = null;
  #eventPresenters = new Map();
  #currentSort = SortTypes.SORT_DAY;
  #newEventBtnComponent = null;
  #newEventBtnContainer = null;
  #newEventPresenter = null;
  #noEventComponent = null;

  constructor({ eventsContainer, eventsModel, filterModel, newEventBtnContainer }) {
    this.#eventsContainer = eventsContainer;
    this.#newEventBtnContainer = newEventBtnContainer;
    this.#listComponent = new EventsListView();
    this.#eventsModel = eventsModel;
    this.#filterModel = filterModel;
    this.#destinations = [...this.#eventsModel.getDestinations()];
    this.#eventsModel.addObserver(this.#handleModelEvent);
    this.#filterModel.addObserver(this.#handleModelEvent);
  }

  init() {
    this.#newEventBtnComponent = new NewEventBtnView({ onClick: this.#newEventBtnClickHandler });
    render(this.#newEventBtnComponent, this.#newEventBtnContainer);

    this.initSort();
    render(this.#listComponent, this.#eventsContainer);

    this.#renderEvents();
  }

  get events() {
    const filterType = this.#filterModel.filter;
    const events = this.#eventsModel.events;
    const filteredEvents = FilterFunctions[filterType](events);
    return SortFunctions[this.#currentSort](filteredEvents);

  }

  #newEventBtnClickHandler = () => {
    this.#newEventBtnComponent.disable();
    this.#filterModel.setFilter(UpdateTypes.MAJOR, FilterTypes.EVERYTHING);
    this.#resetEvents();
    this.#clearNoEvent();
    this.#createNewEvent();
  };

  initSort() {
    if (!this.#sortComponent) {
      this.#sortComponent = new EventsSortView({ onSortTypeChange: this.#handleSortChange });
      render(this.#sortComponent, this.#eventsContainer, RenderPosition.AFTERBEGIN);
    }
  }

  #createNewEvent = () => {

    if (!this.#newEventPresenter) {
      const newEventPresenter = new NewEventPresenter({
        listComponent: this.#listComponent,
        eventsModel: this.#eventsModel,
        allDestinations: this.#destinations,
        onDataChange: this.#handleViewAction,
        handleCloseClick: () => {
          this.#newEventBtnComponent.activate();
          if (this.events.length === 0) {
            this.#clearNoEvent();
            this.#createNoEvent();
          }
        }
      });
      this.#newEventPresenter = newEventPresenter;
    }
    this.#newEventPresenter.init();
  };

  #createNoEvent() {
    this.#noEventComponent = new NoEventsView(this.#filterModel.filter);
    render(this.#noEventComponent, this.#eventsContainer);
  }

  #renderEvents() {
    const events = this.events;
    if (events.length === 0) {
      this.#createNoEvent();
      remove(this.#sortComponent);
      this.#sortComponent = null;
    } else {
      this.initSort();
      for (let i = 0; i < events.length; i++) {
        this.#createEvent(events[i]);
      }
    }
  }

  #clearNoEvent() {
    if (this.#noEventComponent) {
      remove(this.#noEventComponent);
      this.#noEventComponent = null;
    }
  }

  #handleSortChange = (sortType) => {
    this.#currentSort = sortNameAdapter(sortType);
    this.#clearEventsList();
    this.#renderEvents();

  };

  #handleViewAction = (actionType, updateType, update) => {

    switch (actionType) {
      case UserActions.ADD_EVENT:
        this.#eventsModel.addEvent(updateType, update);
        break;
      case UserActions.DELETE_EVENT:
        this.#eventsModel.deleteEvent(updateType, update);
        break;
      case UserActions.UPDATE_EVENT:
        this.#eventsModel.updateEvent(updateType, update);
        break;
    }

  };

  #handleModelEvent = (updateType, data) => {
    switch (updateType) {
      case UpdateTypes.PATCH:
        this.#eventPresenters.get(data.id).init(data);
        break;
      case UpdateTypes.MINOR:

        this.#clearEventsList();
        this.#clearNoEvent();
        this.#renderEvents();
        break;
      case UpdateTypes.MAJOR:

        this.#clearEventsList();
        this.#clearNoEvent();
        this.initSort();
        this.#resetSort();
        this.#renderEvents();
        break;
    }

  };

  #resetSort() {

    this.#sortComponent?.resetSort();
    this.#currentSort = SortTypes.SORT_DAY;
  }

  #resetEvents = () => {
    this.#eventPresenters.forEach((presenter) => presenter.resetView());
    this.#newEventPresenter?.destroy();
  };

  #clearEventsList() {
    this.#eventPresenters.forEach((presenter) => presenter.destroy());
    this.#eventPresenters.clear();

  }

  #createEvent(event) {

    const eventPresenter = new EventPresenter({
      listComponent: this.#listComponent,
      eventsModel: this.#eventsModel,
      allDestinations: this.#destinations,
      onDataChange: this.#handleViewAction,
      onModeChange: this.#resetEvents
    });

    this.#eventPresenters.set(event.id, eventPresenter);
    eventPresenter.init(event);

  }


}

