// src/store/authSlice.ts
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';

// Geliştirilmiş User tipi, isAdmin ve avatarUrl özelliklerini içerir
export interface AppUser extends User {
    isAdmin: boolean;
    avatarUrl: string | null;
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

// Yardımcı fonksiyon: Kullanıcı bilgilerini ve profilini birleştirir
const fetchUserProfile = async (user: User) => {
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin, avatar_url')
        .eq('id', user.id)
        .single();

    if (profileError) {
        console.error('Profil bilgisi çekilirken hata oluştu:', profileError);
        return {
            ...user,
            isAdmin: false,
            avatarUrl: null,
        } as AppUser;
    }

    return {
        ...user,
        isAdmin: profileData.is_admin,
        avatarUrl: profileData.avatar_url,
    } as AppUser;
};

// Asenkron Thunk ile giriş yapma işlemi
export const signIn = createAsyncThunk(
    'auth/signIn',
    async ({ email, password }: Record<string, string>, { rejectWithValue }) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            return rejectWithValue(error.message);
        }
        if (!data.user) {
            return rejectWithValue('Giriş işlemi başarısız. Kullanıcı bulunamadı.');
        }

        // Kullanıcı giriş yaptığında profili çek
        return await fetchUserProfile(data.user);
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
        if (!data.user) {
            return rejectWithValue('Kayıt işlemi başarısız. Kullanıcı bulunamadı.');
        }
        
        // Kullanıcı kayıt olduğunda profili çek
        return await fetchUserProfile(data.user);
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
        // Kullanıcı giriş isteği gönderildiğinde (bekleme aşaması)
        .addCase(signIn.pending, (state) => {
            state.status = 'loading';     // işlem devam ediyor
            state.error = null;           // hata temizleniyor
        })
        // Kullanıcı giriş başarılı olduğunda
        .addCase(signIn.fulfilled, (state, action: PayloadAction<AppUser | null>) => {
            state.status = 'succeeded';               // işlem başarılı
            state.user = action.payload;              // backend’den gelen kullanıcı bilgisi state’e yazılır
            state.isAuthenticated = !!action.payload; // kullanıcı varsa true, yoksa false
        })
        // Kullanıcı giriş başarısız olduğunda
        .addCase(signIn.rejected, (state, action) => {
            state.status = 'failed';                  // işlem başarısız
            state.error = action.payload as string;   // hata mesajı saklanır
            state.user = null;                        // kullanıcı bilgisi sıfırlanır
            state.isAuthenticated = false;            // oturum kapalı
        })

        // Kullanıcı kayıt isteği gönderildiğinde
        .addCase(signUp.pending, (state) => {
            state.status = 'loading';     // işlem devam ediyor
            state.error = null;           // hata temizleniyor
        })
        // Kullanıcı kayıt başarılı olduğunda
        .addCase(signUp.fulfilled, (state, action: PayloadAction<AppUser | null>) => {
            state.status = 'succeeded';               // işlem başarılı
            state.user = action.payload;              // yeni kullanıcı bilgisi saklanır
            state.isAuthenticated = !!action.payload; // kullanıcı varsa true
        })
        // Kullanıcı kayıt başarısız olduğunda
        .addCase(signUp.rejected, (state, action) => {
            state.status = 'failed';                  // işlem başarısız
            state.error = action.payload as string;   // hata mesajı saklanır
            state.user = null;                        // kullanıcı bilgisi sıfırlanır
            state.isAuthenticated = false;            // oturum kapalı
        })

        // Kullanıcı çıkış isteği gönderildiğinde
        .addCase(signOut.pending, (state) => {
            state.status = 'loading';     // işlem devam ediyor
        })
        // Kullanıcı çıkış başarılı olduğunda
        .addCase(signOut.fulfilled, (state) => {
            state.status = 'succeeded';   // işlem başarılı
            state.user = null;            // kullanıcı bilgisi sıfırlanır
            state.isAuthenticated = false;// oturum kapalı
        })
        // Kullanıcı çıkış başarısız olduğunda
        .addCase(signOut.rejected, (state, action) => {
            state.status = 'failed';                  // işlem başarısız
            state.error = action.payload as string;   // hata mesajı saklanır
        });
},

});

export const { setUser } = authSlice.actions;

export default authSlice.reducer;
