// src/store/authSlice.ts - TAM MİGRASYON
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../config/api'; // Supabase yerine axios
import type { User } from '@supabase/supabase-js';

export interface AppUser extends User {
    isAdmin: boolean;
    avatarUrl: string | null;
}

interface AuthState {
    user: AppUser | null;
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

// ESKI: Supabase auth.signInWithPassword + profile fetch
// YENI: HTTP POST /auth/signin
export const signIn = createAsyncThunk(
    'auth/signIn',
    async ({ email, password }: Record<string, string>, { rejectWithValue }) => {
        try {
            const response = await apiClient.post('/auth/signin', { email, password });
            
            // Token'ı localStorage'a kaydet
            if (response.data.session?.access_token) {
                localStorage.setItem('supabase.auth.token', response.data.session.access_token);
            }
            
            return response.data.user;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || 'Giriş başarısız'
            );
        }
    }
);

// ESKI: Supabase auth.signUp + profile fetch
// YENI: HTTP POST /auth/signup
export const signUp = createAsyncThunk(
    'auth/signUp',
    async ({ email, password }: Record<string, string>, { rejectWithValue }) => {
        try {
            const response = await apiClient.post('/auth/signup', { email, password });
            return response.data.user;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || 'Kayıt başarısız'
            );
        }
    }
);

// ESKI: Supabase auth.signOut
// YENI: HTTP POST /auth/signout
export const signOut = createAsyncThunk(
    'auth/signOut',
    async (_, { rejectWithValue }) => {
        try {
            await apiClient.post('/auth/signout');
            localStorage.removeItem('supabase.auth.token');
            return null;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || 'Çıkış başarısız'
            );
        }
    }
);

// YENI: Kullanıcı bilgilerini al
export const getCurrentUser = createAsyncThunk(
    'auth/getCurrentUser',
    async (_, { rejectWithValue }) => {
        try {
            const response = await apiClient.get('/auth/me');
            return response.data.user;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || 'Kullanıcı bilgisi alınamadı'
            );
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<AppUser | null>) => {
            state.user = action.payload;
            state.isAuthenticated = !!action.payload;
            state.status = 'succeeded';
        },
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.status = 'idle';
            localStorage.removeItem('supabase.auth.token');
        },
    },
    extraReducers: (builder) => {
        builder
            // signIn
            .addCase(signIn.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(signIn.fulfilled, (state, action: PayloadAction<AppUser | null>) => {
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

            // signUp
            .addCase(signUp.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(signUp.fulfilled, (state, action: PayloadAction<AppUser | null>) => {
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

            // signOut
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
            })

            // getCurrentUser
            .addCase(getCurrentUser.fulfilled, (state, action) => {
                state.user = action.payload;
                state.isAuthenticated = !!action.payload;
                state.status = 'succeeded';
            })
            .addCase(getCurrentUser.rejected, (state) => {
                state.user = null;
                state.isAuthenticated = false;
                state.status = 'failed';
            });
    },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
