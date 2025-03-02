import { render } from './framework/render.js';
import EventsModel from './model/events-model.js';
import EventsPresenter from './presenter/events-presenter.js';


const filtersContainer = document.querySelector('.trip-controls__filters');
const eventsListContainer = document.querySelector('.trip-events');
const eventsModel = new EventsModel();
const eventsPresenter = new EventsPresenter({ eventsContainer: eventsListContainer, eventsModel });



eventsPresenter.init();

