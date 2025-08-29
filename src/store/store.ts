// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import productReducer from './productSlice';
import cartReducer from './cartSlice';
import notificationReducer from './notificationSlice';
import authReducer from './authSlice';
import commentsReducer from './commentSlice'; // 👈 Burası doğru import olmalı

export const store = configureStore({
    reducer: {
        products: productReducer,
        cart: cartReducer,
        notification: notificationReducer,
        auth: authReducer,
        comments: commentsReducer, // 👈 Import edilen reducer'ı kullan
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
