// src/store/commentSlice.ts
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../supabaseClient';
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

// Ürüne ait yorumları ve beğenileri çekme
export const fetchComments = createAsyncThunk<Comment[], number>(
    'comments/fetchComments',
    async (productId, { rejectWithValue }) => {
        try {
            const { data, error } = await supabase
                .from('comments')
                .select(`
                    *,
                    profiles!comments_user_id_fkey(
                        full_name,
                        email,
                        username
                    ),
                    comment_likes(count)
                `)
                .eq('product_id', productId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase error:', error);
                throw new Error(error.message);
            }

            console.log('Fetched comments data:', data);

            const formattedComments: Comment[] = (data as any[]).map(comment => ({
                ...comment,
                user_name: comment.profiles?.full_name || 
                          comment.profiles?.username || 
                          comment.profiles?.email?.split('@')[0] || 
                          'Anonim',
                user_email: comment.profiles?.email,
                likes: comment.comment_likes?.length || 0,
            }));

            return formattedComments;
        } catch (error: any) {
            console.error('fetchComments error:', error);
            return rejectWithValue(error.message || 'Yorumlar yüklenirken hata oluştu');
        }
    }
);

// Yeni yorum ekleme
export const addComment = createAsyncThunk<Comment, { productId: number, userId: string, content: string, parentId: number | null }>(
    'comments/addComment',
    async ({ productId, userId, content, parentId }, { rejectWithValue }) => {
        try {
            console.log('Adding comment with data:', { productId, userId, content, parentId });

            // Önce yorumu ekle
            const { data: commentData, error: insertError } = await supabase
                .from('comments')
                .insert({
                    product_id: productId,
                    user_id: userId,
                    content,
                    parent_comment_id: parentId,
                })
                .select()
                .single();

            if (insertError) {
                console.error('Insert error:', insertError);
                throw new Error(insertError.message);
            }

            console.log('Comment inserted:', commentData);

            // Sonra kullanıcı bilgilerini al
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('full_name, email, username')
                .eq('id', userId)
                .single();

            if (profileError) {
                console.error('Profile error:', profileError);
            }

            console.log('Profile data:', profileData);

            const formattedComment: Comment = {
                ...commentData,
                user_name: profileData?.full_name || 
                          profileData?.username || 
                          profileData?.email?.split('@')[0] || 
                          'Anonim',
                user_email: profileData?.email,
                likes: 0,
            };

            return formattedComment;
        } catch (error: any) {
            console.error('addComment error:', error);
            return rejectWithValue(error.message || 'Yorum eklenirken hata oluştu');
        }
    }
);

// Yorumu beğenme/beğenmekten vazgeçme
export const toggleLike = createAsyncThunk<void, { commentId: number, userId: string }>(
    'comments/toggleLike',
    async ({ commentId, userId }, { rejectWithValue }) => {
        try {
            const { data: existingLike, error: likeError } = await supabase
                .from('comment_likes')
                .select('id')
                .eq('comment_id', commentId)
                .eq('user_id', userId)
                .single();

            if (likeError && likeError.code !== 'PGRST116') {
                throw new Error(likeError.message);
            }

            if (existingLike) {
                // Beğeniyi kaldır
                const { error } = await supabase
                    .from('comment_likes')
                    .delete()
                    .eq('id', existingLike.id);
                
                if (error) throw new Error(error.message);
            } else {
                // Beğeni ekle
                const { error } = await supabase
                    .from('comment_likes')
                    .insert({ 
                        comment_id: commentId, 
                        user_id: userId 
                    });
                
                if (error) throw new Error(error.message);
            }
        } catch (error: any) {
            return rejectWithValue(error.message || 'Beğenme işlemi sırasında hata oluştu');
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
            .addCase(toggleLike.rejected, (state, action) => {
                state.error = action.payload as string;
            });
    },
});

export const { clearComments } = commentSlice.actions;
export default commentSlice.reducer;
