// src/components/Comments.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchComments, addComment, toggleLike } from '../store/commentSlice';
import type { RootState, AppDispatch } from '../store/store';
import { setNotification } from '../store/notificationSlice';
import type { Comment as CommentType } from '../types';

interface CommentsProps {
	productId: number;
}
const Comments: React.FC<CommentsProps> = ({ productId }) => {
	// useDispatch hooku Redux store’a action göndermeyi sağlar( burada tanımlanmış kodun ilerisinde kullanılarak actionu yollar)
	const dispatch = useDispatch<AppDispatch>();
	// useSelector hooku Redux store'dan veri çeker(state i okur)
	const { comments, status, error } = useSelector((state: RootState) => state.comments);
	const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
	// useState hooku compenent içinde state tanımlamak için kullanılır
	// newComment → state değişkeni (örneğin input’tan girilen yorumun değeri).
	// setNewComment → newComment değerini güncelleyen fonksiyon.
	const [newComment, setNewComment] = useState('');
	// replyingTone → state değişkeni (örneğin “pozitif/negatif/nötr” cevap tonu).
	// setReplyingTone → replyingTone değerini güncelleyen fonksiyon.
	const [replyingTo, setReplyingTo] = useState<number | null>(null);

	// useEffect hooku component ilk render edildiğinde veya herhangi bir state değeri [dispatch, productId] değiştiğinde çalışır.
	useEffect(() => {
		dispatch(fetchComments(productId));
	}, [dispatch, productId]);

	const handleAddComment = async (parentId: number | null = null) => {
		if (!isAuthenticated || !user) {
			// dispatch ile burada bir redux stora bir action gönderiliyor 
			dispatch(setNotification({ message: 'Yorum yapmak için giriş yapmalısınız.', type: 'error' }));
			return;
		}
		if (!newComment.trim()) {
			dispatch(setNotification({ message: 'Yorum içeriği boş olamaz.', type: 'error' }));
			return;
		}

		try {
			// wrap = Bir şeyi paketlemek, katman eklemek.
			//unwrap = O katmanı kaldırıp özüne ulaşmak.
			await dispatch(addComment({ productId, userId: user.id, content: newComment, parentId })).unwrap();
			setNewComment('');
			setReplyingTo(null);
		} catch (err) {
			dispatch(setNotification({ message: `Yorum eklenirken hata oluştu: ${err.message}`, type: 'error' }));
		}
	};

	const handleToggleLike = async (commentId: number) => {
		if (!isAuthenticated || !user) {
			dispatch(setNotification({ message: 'Beğenmek için giriş yapmalısınız.', type: 'error' }));
			return;
		}
		try {
			await dispatch(toggleLike({ commentId, userId: user.id })).unwrap();
			// Beğeni durumunu güncelledikten sonra yorumları yeniden çekebiliriz
			dispatch(fetchComments(productId));
		} catch (err) {
			dispatch(setNotification({ message: `Beğenme işlemi sırasında hata oluştu: ${err.message}`, type: 'error' }));
		}
	};

	const renderComments = (commentList: CommentType[], parentId: number | null = null) => {
		return (
			<div className={`mt-3 ${parentId ? 'ms-5 border-start border-secondary ps-3' : ''}`}>
				{commentList
					.filter(c => c.parent_comment_id === parentId)
					.map(comment => (
						<div key={comment.id} className="card bg-secondary text-white p-3 mb-3">
							<div className="d-flex justify-content-between align-items-center">
								<div>
									<h6 className="card-title mb-0">{comment.user_name}</h6>
									<small className="text-white-50">{new Date(comment.created_at).toLocaleString()}</small>
								</div>
								<div>
									<button
										onClick={() => handleToggleLike(comment.id)}
										className="btn btn-sm btn-outline-light me-2"
									>
										<i className="bi bi-heart-fill"></i> {comment.likes}
									</button>
									<button
										onClick={() => setReplyingTo(comment.id)}
										className="btn btn-sm btn-outline-light"
									>
										Yanıtla
									</button>
								</div>
							</div>
							<p className="card-text mt-2">{comment.content}</p>
							{replyingTo === comment.id && (
								<div className="mt-2">
									<textarea
										className="form-control bg-dark text-white border-secondary"
										rows={2}
										placeholder="Yanıtınızı yazın..."
										value={newComment}
										onChange={(e) => setNewComment(e.target.value)}
									></textarea>
									<button
										onClick={() => handleAddComment(comment.id)}
										className="btn btn-sm btn-success mt-2"
									>
										Gönder
									</button>
									<button
										onClick={() => setReplyingTo(null)}
										className="btn btn-sm btn-danger mt-2 ms-2"
									>
										İptal
									</button>
								</div>
							)}
							{renderComments(comments, comment.id)}
						</div>
					))}
			</div>
		);
	};


	return (
		<div className="mt-5">
			<h3 className="text-white">Yorumlar</h3>
			<hr className="text-white-50" />

			{/* Yorum Ekleme Formu */}
			<div className="card bg-dark text-white p-4 mb-4">
				<h5 className="card-title">Yorum Yap</h5>
				<div className="mb-3">
					<textarea
						className="form-control bg-secondary text-white border-secondary"
						rows={3}
						placeholder="Yorumunuzu yazın..."
						value={newComment}
						onChange={(e) => setNewComment(e.target.value)}
					></textarea>
				</div>
				<button
					onClick={() => handleAddComment()}
					className="btn btn-success"
				>
					Yorumu Gönder
				</button>
			</div>

			{/* Yorum Listesi */}
			{status === 'loading' && <div className="text-center text-white">Yorumlar yükleniyor...</div>}
			{status === 'failed' && <div className="text-center text-danger">Hata: {error}</div>}
			{status === 'succeeded' && comments.length > 0 && renderComments(comments)}
			{status === 'succeeded' && comments.length === 0 && <div className="text-center text-white-50">Henüz yorum yapılmamış. İlk yorumu sen yap!</div>}
		</div>
	);
};

export default Comments;
