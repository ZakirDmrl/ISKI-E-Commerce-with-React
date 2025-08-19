// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import productReducer from './productSlice';
import cartReducer from './cartSlice';
import notificationReducer from './notificationSlice';

export const store = configureStore({
  reducer: {
    products: productReducer,
    cart: cartReducer,
    notification: notificationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
