import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import petReducer from './slices/petSlice';
import bookingReducer from './slices/bookingSlice';
import messageReducer from './slices/messageSlice';
import notificationReducer from './slices/notificationSlice';
import sitterReducer from './slices/sitterSlice';
import appReducer from './slices/appSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    pets: petReducer,
    bookings: bookingReducer,
    messages: messageReducer,
    notifications: notificationReducer,
    sitters: sitterReducer,
    app: appReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

export default store;
