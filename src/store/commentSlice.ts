// src/store/commentSlice.ts - TAM MİGRASYON
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../config/api'; // Supabase yerine axios
import type { Comment } from '../types';

interface CommentState {
    comments: Comment[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: CommentState = {
    comments: [],
    status: 'idle',
    error: null,
};

// ESKI: Supabase complex query
// YENI: Basit HTTP GET isteği
export const fetchComments = createAsyncThunk<Comment[], { productId: number, userId: string | null }>(
    'comments/fetchComments',
    async ({ productId, userId }, { rejectWithValue }) => {
        try {
            // Go backend tek istekle formatted data dönüyor
            const params = userId ? `?user_id=${userId}` : '';
            const response = await apiClient.get(`/comments/product/${productId}${params}`);
            // Backend bazen null dönebilir; güvenli şekilde []'e çevir
            return (response.data?.comments ?? []) as Comment[];
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || 'Yorumlar yüklenirken hata oluştu'
            );
        }
    }
);

// ESKI: Supabase insert + profile fetch
// YENI: Tek HTTP POST isteği
export const addComment = createAsyncThunk<Comment, { productId: number, userId: string, content: string, parentId: number | null }>(
    'comments/addComment',
    async ({ productId, content, parentId }, { rejectWithValue }) => {
        try {
            const response = await apiClient.post('/comments', {
                product_id: productId,
                content: content,
                parent_id: parentId
            });

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || 'Yorum eklenirken hata oluştu'
            );
        }
    }
);

// ESKI: Supabase select + conditional insert/delete
// YENI: Tek HTTP POST isteği (backend'de toggle logic)
export const toggleLike = createAsyncThunk<void, { commentId: number, userId: string }>(
    'comments/toggleLike',
    async ({ commentId}, { rejectWithValue }) => {
        try {
            await apiClient.post(`/comments/${commentId}/toggle-like`);
            // Backend toggle yaptığı için response'a gerek yok
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || 'Beğenme işlemi sırasında hata oluştu'
            );
        }
    }
);

const commentSlice = createSlice({
    name: 'comments',
    initialState,
    reducers: {
        clearComments: (state) => {
            state.comments = [];
            state.status = 'idle';
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchComments.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchComments.fulfilled, (state, action: PayloadAction<Comment[]>) => {
                state.status = 'succeeded';
                state.comments = action.payload;
                state.error = null;
            })
            .addCase(fetchComments.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            })
            .addCase(addComment.pending, (state) => {
                state.error = null;
            })
            .addCase(addComment.fulfilled, (state, action: PayloadAction<Comment>) => {
                // Yeni yorumu listenin başına ekle
                state.comments.unshift(action.payload);
            })
            .addCase(addComment.rejected, (state, action) => {
                state.error = action.payload as string;
            })
            .addCase(toggleLike.fulfilled, (state) => {
                // toggleLike başarılı olduğunda comments'ları yeniden fetch etmek gerekebilir
                // veya optimistic update yapılabilir
				state.error = null;
				
            })
            .addCase(toggleLike.rejected, (state, action) => {
                state.error = action.payload as string;
            });
    },
});

export const { clearComments } = commentSlice.actions;
export default commentSlice.reducer;
