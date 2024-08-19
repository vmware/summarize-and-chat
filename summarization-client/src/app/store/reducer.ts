import { ActionReducerMap, createReducer, createSelector, on } from '@ngrx/store';
import * as AppActions from './actions'
import { AppAlert, AppEvent, User } from '../models/common';
import { Model } from '../models/model';

export interface ICommonState  {
  alert?: AppAlert;
  event?: AppEvent;
  user?: User;  
  models: Model[];
  selected_model?:Model
}

export const initCommonState: ICommonState = {
  alert: undefined,
  event: undefined,
  user: undefined,
  models: [],
  selected_model: undefined,

};

export interface IAppState {
  common: ICommonState;
}

export const initAppState: IAppState = {
  common: initCommonState,
};

export const commonReducers = createReducer(
  initCommonState,
  on(AppActions.setAlert, (state, { alert }) => (
    {...state, alert: alert })
  ),
  on(AppActions.setAppEvent, (state, { event }) => (
    {...state, event: event })
  ),
  on(AppActions.clearAppEvent, (state, {}) => (
    {...state, event: undefined })
  ),
  on(AppActions.setUser, (state, { user }) => (
    {...state, user: user})
  ),
  on(AppActions.setModels, (state, { models }) => {
    return {...state, models: models }
  }),
  on(AppActions.setSelectedModel, (state, { selected }) => {
    return {...state,  selected_model: selected }
  }),

);

export const appReducers: ActionReducerMap<IAppState, any> = {
  common: commonReducers
}

export const commonState = (state: IAppState) => state.common;
export const getAlert = createSelector(commonState, (state:ICommonState) => state.alert)
export const getAppEvent = createSelector(commonState, (state:ICommonState) => state.event)
export const getUser = createSelector(commonState, (state:ICommonState) => state.user)

export const getModels = createSelector(commonState, (state:ICommonState) => state.models)
export const getSelectedModel = createSelector(commonState, (state:ICommonState) => state.selected_model);
