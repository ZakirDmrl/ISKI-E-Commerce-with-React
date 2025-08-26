// src/store/authSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';

// Geliştirilmiş User tipi, isAdmin özelliğini içerir
export interface AppUser extends User {
	isAdmin: boolean;
}

// Auth State'inin tipini tanımla
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

// Asenkron Thunk ile giriş yapma işlemi
export const signIn = createAsyncThunk(
	'auth/signIn',
	async ({ email, password }: Record<string, string>, { rejectWithValue }) => {
		const { data, error } = await supabase.auth.signInWithPassword({ email, password });
		if (error) {
			return rejectWithValue(error.message);
		}
		// Kullanıcı nesnesine isAdmin özelliğini ekle
		const isAdmin = data.user?.email === 'ustatkirito40@gmail.com';
		return { ...data.user, isAdmin } as AppUser;
	}
);

// Asenkron Thunk ile kayıt olma işlemi
export const signUp = createAsyncThunk(
	'auth/signUp',
	async ({ email, password }: Record<string, string>, { rejectWithValue }) => {
		const { data, error } = await supabase.auth.signUp({ email, password });
		if (error) {
			return rejectWithValue(error.message);
		}
		const isAdmin = data.user?.email === 'ustatkirito40@gmail.com'
		return { ...data.user, isAdmin } as AppUser;
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
		return null;
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
	},
	extraReducers: (builder) => {
		builder
			// signIn Reducer'ları
			.addCase(signIn.pending, (state) => {
				state.status = 'loading';
				state.error = null;
			})
			.addCase(signIn.fulfilled, (state, action: PayloadAction<AppUser | null>) => {
				state.status = 'succeeded';
				// Giriş başarılı olduğunda isAdmin özelliğini atar
				const isAdmin = action.payload?.email === 'ustatkirito40@gmail.com';
				state.user = { ...action.payload, isAdmin } as AppUser;
				state.isAuthenticated = !!action.payload;
			})
			.addCase(signIn.rejected, (state, action) => {
				state.status = 'failed';
				state.error = action.payload as string;
				state.user = null;
				state.isAuthenticated = false;
			})
			// signUp Reducer'ları
			.addCase(signUp.pending, (state) => {
				state.status = 'loading';
				state.error = null;
			})
			.addCase(signUp.fulfilled, (state, action: PayloadAction<AppUser | null>) => {
				state.status = 'succeeded';
				// Kayıt başarılı olduğunda isAdmin özelliğini atar
				const isAdmin = action.payload?.email === 'ustatkirito40@gmail.com';
				state.user = { ...action.payload, isAdmin } as AppUser;
				state.isAuthenticated = !!action.payload;
			})
			.addCase(signUp.rejected, (state, action) => {
				state.status = 'failed';
				state.error = action.payload as string;
				state.user = null;
				state.isAuthenticated = false;
			})
			// signOut Reducer'ları
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
