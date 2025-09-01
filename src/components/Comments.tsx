// src/components/Comments.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchComments, addComment, toggleLike } from '../store/commentSlice';
import type { RootState, AppDispatch } from '../store/store';
import { setNotification } from '../store/notificationSlice';
import type { Comment as CommentType } from '../types';
import { supabase } from '../supabaseClient';

interface CommentsProps {
	productId: number;
}

const Comments: React.FC<CommentsProps> = ({ productId }) => {
	const dispatch = useDispatch<AppDispatch>();
	const { comments, status, error } = useSelector((state: RootState) => state.comments);
	const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
	const [newComment, setNewComment] = useState('');
	const [replyingTo, setReplyingTo] = useState<number | null>(null);
	const [replyContent, setReplyContent] = useState('');
	const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
	const [userProfiles, setUserProfiles] = useState<{ [key: string]: { avatar_url?: string, full_name?: string } }>({});
	const [currentUserProfile, setCurrentUserProfile] = useState<{ avatar_url?: string, full_name?: string } | null>(null);

	// Load user profiles for avatars
	useEffect(() => {
		const loadUserProfiles = async () => {
			if (comments.length > 0) {
				const userIds = [...new Set(comments.map(c => c.user_id || c.user_name))];

				const { data } = await supabase
					.from('profiles')
					.select('full_name, avatar_url, id')
					.in('id', userIds);

				if (data) {
					const profileMap = data.reduce((acc, profile) => {
						acc[profile.id] = {
							avatar_url: profile.avatar_url,
							full_name: profile.full_name
						};
						return acc;
					}, {} as { [key: string]: { avatar_url?: string, full_name?: string } });

					setUserProfiles(profileMap);
				}
			}
		};

		loadUserProfiles();
	}, [comments]);

	// Load current user profile
	useEffect(() => {
		const loadCurrentUserProfile = async () => {
			if (user?.id) {
				const { data } = await supabase
					.from('profiles')
					.select('avatar_url, full_name')
					.eq('id', user.id)
					.single();

				setCurrentUserProfile(data);
			}
		};

		if (isAuthenticated && user) {
			loadCurrentUserProfile();
		}
	}, [isAuthenticated, user]);

	useEffect(() => {
		dispatch(fetchComments({ productId, userId: user?.id || null }));
	}, [dispatch, productId]);

	// Kullanıcı adından profil resmi oluşturma fonksiyonu
	const generateProfilePicture = (userName: string, avatarUrl?: string, size: number = 40) => {
		if (avatarUrl) {
			return (
				<img
					src={avatarUrl}
					alt={userName}
					style={{
						width: size,
						height: size,
						borderRadius: '50%',
						objectFit: 'cover',
						flexShrink: 0,
						border: '2px solid rgba(255,255,255,0.2)'
					}}
				/>
			);
		}

		const colors = [
			'#667eea', '#764ba2', '#f093fb', '#f5576c',
			'#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
			'#ffecd2', '#fcb69f', '#a8edea', '#fed6e3',
			'#fbc2eb', '#a6c1ee', '#c2e9fb', '#a1c4fd'
		];

		const initials = userName
			.split(' ')
			.map(word => word.charAt(0).toUpperCase())
			.join('')
			.substring(0, 2);

		const backgroundColor = colors[userName.length % colors.length];

		return (
			<div
				className="profile-picture"
				style={{
					width: size,
					height: size,
					backgroundColor,
					borderRadius: '50%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					color: 'white',
					fontWeight: '600',
					fontSize: `${size * 0.4}px`,
					flexShrink: 0,
					border: '2px solid rgba(255,255,255,0.2)'
				}}
			>
				{initials}
			</div>
		);
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

		if (diffInMinutes < 1) return 'Şimdi';
		if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
		if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} saat önce`;
		if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} gün önce`;

		return date.toLocaleDateString('tr-TR');
	};

	const handleAddComment = async (parentId: number | null = null) => {
		if (!isAuthenticated || !user) {
			dispatch(setNotification({ message: 'Yorum yapmak için giriş yapmalısınız.', type: 'error' }));
			return;
		}

		const content = parentId ? replyContent : newComment;
		if (!content.trim()) {
			dispatch(setNotification({ message: 'Yorum içeriği boş olamaz.', type: 'error' }));
			return;
		}

		try {
			await dispatch(addComment({ productId, userId: user.id, content, parentId })).unwrap();
			if (parentId) {
				setReplyContent('');
				setReplyingTo(null);
			} else {
				setNewComment('');
			}
			dispatch(setNotification({ message: 'Yorum başarıyla eklendi!', type: 'success' }));
		} catch (err ) {
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
    dispatch(fetchComments({ productId, userId: user?.id || null }));
		} catch (err ) {
			dispatch(setNotification({ message: `Beğenme işlemi sırasında hata oluştu: ${err.message}`, type: 'error' }));
		}
	};

	const toggleReplies = (commentId: number) => {
		const newExpanded = new Set(expandedReplies);
		if (newExpanded.has(commentId)) {
			newExpanded.delete(commentId);
		} else {
			newExpanded.add(commentId);
		}
		setExpandedReplies(newExpanded);
	};

	const getRepliesCount = (commentId: number) => {
		return comments.filter(c => c.parent_comment_id === commentId).length;
	};

	const renderComments = (commentList: CommentType[], parentId: number | null = null, depth: number = 0) => {
		const filteredComments = commentList.filter(c => c.parent_comment_id === parentId);

		if (filteredComments.length === 0) return null;

		return (
			<div className={`comments-container ${parentId ? 'replies-container' : ''}`}>
				{filteredComments.map(comment => {
					const repliesCount = getRepliesCount(comment.id);
					const hasReplies = repliesCount > 0;
					const isExpanded = expandedReplies.has(comment.id);

					return (
						<div key={comment.id} className={`comment-item ${parentId ? 'reply-item' : ''}`}>
							<div className="comment-content">
								{/* Comment Header */}
								<div className="comment-header">
									<div className="user-info">
										{generateProfilePicture(
											comment.user_name,
											userProfiles[comment.user_id || comment.user_name]?.avatar_url,
											parentId ? 32 : 40
										)}
										<div className="user-details">
											<span className="user-name">
												{userProfiles[comment.user_id || comment.user_name]?.full_name || comment.user_name}
											</span>
											<span className="comment-time">{formatDate(comment.created_at)}</span>
										</div>
									</div>

									<div className="comment-actions">
										<button
											onClick={() => handleToggleLike(comment.id)}
											className={`action-btn like-btn ${comment.likes ? 'liked' : ''}`}
										>
											<span className="heart-icon">❤️</span>
											{comment.likes > 0 && <span className="like-count">{comment.likes}</span>}
										</button>

										{!parentId && (
											<button
												onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
												className="action-btn reply-btn"
											>
												💬 Yanıtla
											</button>
										)}
									</div>
								</div>

								{/* Comment Text */}
								<div className="comment-text">
									{comment.content}
								</div>

								{/* Show Replies Toggle */}
								{hasReplies && !parentId && (
									<button
										onClick={() => toggleReplies(comment.id)}
										className="show-replies-btn"
									>
										{isExpanded ? '⬆️' : '⬇️'} {repliesCount} yanıt {isExpanded ? 'gizle' : 'göster'}
									</button>
								)}

								{/* Reply Form */}
								{replyingTo === comment.id && (
									<div className="reply-form">
										<div className="reply-input-container">
											{generateProfilePicture(
												currentUserProfile?.full_name || user?.email || 'User',
												currentUserProfile?.avatar_url,
												32
											)}
											<textarea
												className="reply-textarea"
												rows={3}
												placeholder="Yanıtınızı yazın..."
												value={replyContent}
												onChange={(e) => setReplyContent(e.target.value)}
											/>
										</div>
										<div className="reply-actions">
											<button
												onClick={() => handleAddComment(comment.id)}
												className="reply-submit-btn"
												disabled={!replyContent.trim()}
											>
												Gönder
											</button>
											<button
												onClick={() => {
													setReplyingTo(null);
													setReplyContent('');
												}}
												className="reply-cancel-btn"
											>
												İptal
											</button>
										</div>
									</div>
								)}
							</div>

							{/* Nested Replies */}
							{hasReplies && !parentId && isExpanded && (
								<div className="replies-section">
									{renderComments(comments, comment.id, depth + 1)}
								</div>
							)}
						</div>
					);
				})}
			</div>
		);
	};

	return (
		<div className="comments-section">
			<div className="comments-header">
				<h3 className="section-title">
					💬 Yorumlar ({comments.filter(c => !c.parent_comment_id).length})
				</h3>
			</div>

			{/* Add Comment Form */}
			<div className="add-comment-form">
				<div className="form-header">
					<h5 className="form-title">Yorum Yap</h5>
				</div>

				<div className="comment-input-container">
					{isAuthenticated && user && generateProfilePicture(
						currentUserProfile?.full_name || user.email || 'User',
						currentUserProfile?.avatar_url,
						40
					)}
					<div className="input-wrapper">
						<textarea
							className="comment-textarea"
							rows={4}
							placeholder={isAuthenticated ? "Ürün hakkındaki düşüncelerinizi paylaşın..." : "Yorum yapmak için giriş yapmalısınız"}
							value={newComment}
							onChange={(e) => setNewComment(e.target.value)}
							disabled={!isAuthenticated}
						/>
						<button
							onClick={() => handleAddComment()}
							className="submit-comment-btn"
							disabled={!isAuthenticated || !newComment.trim()}
						>
							{!isAuthenticated ? '🔒 Giriş Yapın' : '✨ Yorumu Paylaş'}
						</button>
					</div>
				</div>
			</div>

			{/* Comments List */}
			<div className="comments-list">
				{status === 'loading' && (
					<div className="loading-state">
						<div className="loading-spinner"></div>
						<span>Yorumlar yükleniyor...</span>
					</div>
				)}

				{status === 'failed' && (
					<div className="error-state">
						<span className="error-icon">⚠️</span>
						<span>Yorumlar yüklenirken hata oluştu: {error}</span>
					</div>
				)}

				{status === 'succeeded' && comments.length > 0 && (
					renderComments(comments)
				)}

				{status === 'succeeded' && comments.length === 0 && (
					<div className="empty-state">
						<div className="empty-icon">💭</div>
						<h4>Henüz yorum yok</h4>
						<p>Bu ürün için ilk yorumu sen yap ve diğer kullanıcılara yardımcı ol!</p>
					</div>
				)}
			</div>

			<style>{`
				.comments-section {
					margin-top: 2rem;
					padding: 0;
				}

				.comments-header {
					margin-bottom: 2rem;
				}

				.section-title {
					color: #fff;
					font-size: clamp(1.2rem, 3vw, 1.5rem);
					font-weight: 700;
					margin: 0;
					padding: 1rem 1.5rem;
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					border-radius: 12px;
					text-align: center;
				}

				/* Add Comment Form */
				.add-comment-form {
					background: rgba(255,255,255,0.05);
					backdrop-filter: blur(10px);
					border-radius: 16px;
					padding: 1.5rem;
					margin-bottom: 2rem;
					border: 1px solid rgba(255,255,255,0.1);
					box-shadow: 0 10px 30px rgba(0,0,0,0.2);
				}

				.form-header {
					margin-bottom: 1rem;
				}

				.form-title {
					color: #fff;
					font-size: 1.1rem;
					font-weight: 600;
					margin: 0;
				}

				.comment-input-container {
					display: flex;
					gap: 1rem;
					align-items: flex-start;
				}

				.input-wrapper {
					flex: 1;
					display: flex;
					flex-direction: column;
					gap: 0.75rem;
				}

				.comment-textarea {
					width: 100%;
					padding: 1rem;
					background: rgba(255,255,255,0.1);
					border: 2px solid rgba(255,255,255,0.2);
					border-radius: 12px;
					color: #fff;
					font-size: 0.95rem;
					line-height: 1.5;
					resize: vertical;
					min-height: 100px;
					transition: all 0.3s ease;
					font-family: inherit;
				}

				.comment-textarea:focus {
					outline: none;
					border-color: #667eea;
					box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
					background: rgba(255,255,255,0.15);
				}

				.comment-textarea::placeholder {
					color: rgba(255,255,255,0.5);
				}

				.comment-textarea:disabled {
					opacity: 0.6;
					cursor: not-allowed;
				}

				.submit-comment-btn {
					align-self: flex-end;
					padding: 0.75rem 1.5rem;
					background: linear-gradient(45deg, #667eea, #764ba2);
					color: white;
					border: none;
					border-radius: 10px;
					font-size: 0.9rem;
					font-weight: 600;
					cursor: pointer;
					transition: all 0.3s ease;
					min-width: 140px;
				}

				.submit-comment-btn:hover:not(:disabled) {
					transform: translateY(-2px);
					box-shadow: 0 5px 15px rgba(102,126,234,0.4);
				}

				.submit-comment-btn:disabled {
					background: rgba(108,117,125,0.8);
					cursor: not-allowed;
					transform: none;
					box-shadow: none;
				}

				/* Comments List */
				.comments-list {
					display: flex;
					flex-direction: column;
					gap: 1rem;
				}

				.comments-container {
					display: flex;
					flex-direction: column;
					gap: 1rem;
				}

				.replies-container {
					margin-left: 2rem;
					padding-left: 1rem;
					border-left: 2px solid rgba(102,126,234,0.3);
				}

				.comment-item {
					background: rgba(255,255,255,0.05);
					border-radius: 12px;
					padding: 1.25rem;
					border: 1px solid rgba(255,255,255,0.1);
					transition: all 0.3s ease;
				}

				.comment-item:hover {
					background: rgba(255,255,255,0.08);
					border-color: rgba(255,255,255,0.2);
				}

				.reply-item {
					background: rgba(255,255,255,0.03);
					margin-top: 0.5rem;
				}

				.comment-content {
					display: flex;
					flex-direction: column;
					gap: 0.75rem;
				}

				.comment-header {
					display: flex;
					justify-content: space-between;
					align-items: flex-start;
					gap: 1rem;
				}

				.user-info {
					display: flex;
					align-items: center;
					gap: 0.75rem;
					flex: 1;
				}

				.user-details {
					display: flex;
					flex-direction: column;
					gap: 0.25rem;
				}

				.user-name {
					color: #fff;
					font-weight: 600;
					font-size: 0.95rem;
				}

				.comment-time {
					color: #aaa;
					font-size: 0.8rem;
				}

				.comment-actions {
					display: flex;
					gap: 0.5rem;
					align-items: center;
				}

				.action-btn {
					background: rgba(255,255,255,0.1);
					border: none;
					border-radius: 8px;
					padding: 0.5rem 0.75rem;
					color: #ccc;
					font-size: 0.8rem;
					cursor: pointer;
					transition: all 0.3s ease;
					display: flex;
					align-items: center;
					gap: 0.25rem;
				}

				.action-btn:hover {
					background: rgba(255,255,255,0.2);
					color: #fff;
				}

				.like-btn.liked {
					background: rgba(220,53,69,0.2);
					color: #dc3545;
				}

				.like-btn.liked:hover {
					background: rgba(220,53,69,0.3);
				}

				.heart-icon {
					font-size: 0.9rem;
				}

				.like-count {
					font-weight: 600;
					font-size: 0.8rem;
				}

				.comment-text {
					color: #e0e0e0;
					font-size: 0.95rem;
					line-height: 1.6;
					margin-left: 3rem;
					word-wrap: break-word;
				}

				.show-replies-btn {
					background: none;
					border: none;
					color: #667eea;
					font-size: 0.85rem;
					cursor: pointer;
					padding: 0.5rem 0;
					margin-left: 3rem;
					transition: color 0.3s ease;
				}

				.show-replies-btn:hover {
					color: #764ba2;
				}

				/* Reply Form */
				.reply-form {
					margin-left: 3rem;
					margin-top: 0.75rem;
					padding: 1rem;
					background: rgba(255,255,255,0.03);
					border-radius: 8px;
					border: 1px solid rgba(255,255,255,0.1);
				}

				.reply-input-container {
					display: flex;
					gap: 0.75rem;
					align-items: flex-start;
					margin-bottom: 0.75rem;
				}

				.reply-textarea {
					flex: 1;
					padding: 0.75rem;
					background: rgba(255,255,255,0.1);
					border: 2px solid rgba(255,255,255,0.2);
					border-radius: 8px;
					color: #fff;
					font-size: 0.9rem;
					resize: vertical;
					min-height: 80px;
					transition: all 0.3s ease;
					font-family: inherit;
				}

				.reply-textarea:focus {
					outline: none;
					border-color: #667eea;
					background: rgba(255,255,255,0.15);
				}

				.reply-textarea::placeholder {
					color: rgba(255,255,255,0.5);
				}

				.reply-actions {
					display: flex;
					gap: 0.5rem;
					justify-content: flex-end;
				}

				.reply-submit-btn,
				.reply-cancel-btn {
					padding: 0.5rem 1rem;
					border: none;
					border-radius: 6px;
					font-size: 0.85rem;
					font-weight: 600;
					cursor: pointer;
					transition: all 0.3s ease;
				}

				.reply-submit-btn {
					background: linear-gradient(45deg, #28a745, #20c997);
					color: white;
				}

				.reply-submit-btn:hover:not(:disabled) {
					transform: translateY(-1px);
					box-shadow: 0 3px 10px rgba(40,167,69,0.3);
				}

				.reply-submit-btn:disabled {
					background: rgba(108,117,125,0.8);
					cursor: not-allowed;
					transform: none;
				}

				.reply-cancel-btn {
					background: rgba(108,117,125,0.2);
					color: #ccc;
				}

				.reply-cancel-btn:hover {
					background: rgba(108,117,125,0.4);
					color: #fff;
				}

				.replies-section {
					margin-top: 1rem;
				}

				/* Loading and Error States */
				.loading-state,
				.error-state {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					padding: 2rem;
					gap: 1rem;
					color: #ccc;
					text-align: center;
				}

				.loading-spinner {
					width: 30px;
					height: 30px;
					border: 3px solid #333;
					border-top: 3px solid #667eea;
					border-radius: 50%;
					animation: spin 1s linear infinite;
				}

				.error-icon {
					font-size: 2rem;
				}

				.empty-state {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					padding: 3rem 2rem;
					text-align: center;
					background: rgba(255,255,255,0.03);
					border-radius: 16px;
					border: 2px dashed rgba(255,255,255,0.2);
				}

				.empty-icon {
					font-size: 3rem;
					margin-bottom: 1rem;
				}

				.empty-state h4 {
					color: #fff;
					font-size: 1.2rem;
					font-weight: 600;
					margin: 0 0 0.5rem 0;
				}

				.empty-state p {
					color: #ccc;
					font-size: 0.95rem;
					margin: 0;
					max-width: 400px;
				}

				/* Mobile Responsive */
				@media (max-width: 768px) {
					.comment-input-container {
						flex-direction: column;
					}

					.comment-text {
						margin-left: 0;
					}

					.reply-form {
						margin-left: 0;
					}

					.show-replies-btn {
						margin-left: 0;
					}

					.replies-container {
						margin-left: 1rem;
						padding-left: 0.75rem;
					}

					.comment-header {
						flex-direction: column;
						align-items: flex-start;
						gap: 0.75rem;
					}

					.comment-actions {
						align-self: flex-end;
					}

					.reply-input-container {
						flex-direction: column;
					}

					.reply-actions {
						flex-direction: column;
						align-items: stretch;
					}

					.reply-submit-btn,
					.reply-cancel-btn {
						width: 100%;
					}
				}

				@media (max-width: 480px) {
					.add-comment-form,
					.comment-item {
						padding: 1rem;
					}

					.section-title {
						font-size: 1.1rem;
						padding: 0.75rem 1rem;
					}

					.comment-actions {
						flex-direction: column;
						gap: 0.25rem;
					}

					.action-btn {
						width: 100%;
						justify-content: center;
					}
				}

				/* High DPI adjustments */
				@media (min-resolution: 150dpi) {
					.add-comment-form {
						padding: 2rem;
					}
					
					.comment-item {
						padding: 1.5rem;
					}
					
					.comment-textarea {
						padding: 1.2rem;
					}
				}
			`}</style>
		</div>
	);
};

export default Comments;
