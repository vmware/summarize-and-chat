/*
Copyright 2024 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import { createAction, props } from '@ngrx/store';
import { AppAlert, AppEvent, User } from '../models/common';
import { Model } from '../models/model';

export const httpRequestFailure = createAction('[Error] Http Request Failure',
    props<{ error: any }>() );

//--- COMMON ----
export const setAlert = createAction('[Alert] Set Alert', props<{ alert: AppAlert }>())
export const setAppEvent = createAction('[AppEvent] Set AppEvent', props<{ event: AppEvent }>())
export const clearAppEvent = createAction('[AppEvent] Clear AppEvent')
export const setUser = createAction('[User] Set User', props<{ user?: User }>() )

export const setSelectedModel = createAction('[Model] Set Selected Model', props<{ selected: Model }>() );

export const setModels = createAction('[Model] Load Models Success', props<{ models: Model[] }>() );
