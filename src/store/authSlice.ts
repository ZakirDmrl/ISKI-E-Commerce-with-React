// src/store/authSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';

// Auth State'inin tipini tanımla
interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    status: 'idle',
    error: null,
};

// Asenkron Thunk ile giriş yapma işlemi
export const signIn = createAsyncThunk(
    'auth/signIn',
    async ({ email, password }: any, { rejectWithValue }) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
            return rejectWithValue(error.message);
        }

        return data.user;
    }
);

// Asenkron Thunk ile kayıt olma işlemi
export const signUp = createAsyncThunk(
    'auth/signUp',
    async ({ email, password }: any, { rejectWithValue }) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        
        if (error) {
            return rejectWithValue(error.message);
        }

        return data.user;
    }
);

// Asenkron Thunk ile çıkış yapma işlemi
export const signOut = createAsyncThunk(
    'auth/signOut',
    async (_, { rejectWithValue }) => {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            return rejectWithValue(error.message);
        }

        return null; // Çıkış başarılıysa null döndür
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // Senkron olarak kullanıcı durumunu güncelleme (Supabase'in onAuthStateChange listener'ı için)
        setUser: (state, action: PayloadAction<User | null>) => {
            state.user = action.payload;
            state.isAuthenticated = !!action.payload;
            state.status = 'succeeded';
        },
    },
    extraReducers: (builder) => {
        builder
            // Giriş Reducer'ları
            .addCase(signIn.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(signIn.fulfilled, (state, action: PayloadAction<User | null>) => {
                state.status = 'succeeded';
                state.user = action.payload;
                state.isAuthenticated = !!action.payload;
            })
            .addCase(signIn.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
                state.user = null;
                state.isAuthenticated = false;
            })
            // Kayıt Reducer'ları
            .addCase(signUp.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(signUp.fulfilled, (state, action: PayloadAction<User | null>) => {
                state.status = 'succeeded';
                state.user = action.payload;
                state.isAuthenticated = !!action.payload;
            })
            .addCase(signUp.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
                state.user = null;
                state.isAuthenticated = false;
            })
            // Çıkış Reducer'ları
            .addCase(signOut.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(signOut.fulfilled, (state) => {
                state.status = 'succeeded';
                state.user = null;
                state.isAuthenticated = false;
            })
            .addCase(signOut.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            });
    },
});

export const { setUser } = authSlice.actions;

export default authSlice.reducer;
